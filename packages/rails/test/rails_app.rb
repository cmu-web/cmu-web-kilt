# frozen_string_literal: true

# Run in a separate process so each case boots a fresh Rails application.
require 'tmpdir'
require 'fileutils'
require 'json'
require 'logger'
require 'action_controller/railtie'
require 'propshaft' unless ENV['WITHOUT_ASSETS'] == '1'
require 'importmap-rails' unless ENV['WITHOUT_IMPORTMAP'] == '1'
require File.join(ENV.fetch('CMU_WEB_KILT_LIBRARY'), 'cmu-web-kilt')
require 'rack/mock'

Dir.mktmpdir('cmu-web-kilt-rails') do |directory|
  FileUtils.mkdir_p(File.join(directory, 'config'))
  pins = ENV['OVERRIDE_PIN'] == '1' ? "pin 'cmu-web-kilt', to: 'https://example.test/override.js'" : ''
  File.write(File.join(directory, 'config/importmap.rb'), pins)

  app_class = Class.new(Rails::Application) do
    config.root = directory
    config.eager_load = false
    config.secret_key_base = 'cmu-web-kilt-test-secret'
    config.logger = Logger.new(File::NULL)
    config.hosts.clear
    config.action_dispatch.show_exceptions = :none
  end
  app = app_class.instance
  app.initialize!

  result = { version: CmuWebKilt::VERSION, gem_root: CmuWebKilt::Engine.root.to_s }
  if app.respond_to?(:assets) && app.assets
    helpers = ActionController::Base.helpers
    names = %w[cmu-cms.css cmu-app.css cmu-app.js]
    result[:assets] = names.to_h do |name|
      path = helpers.asset_path(name)
      response = Rack::MockRequest.new(app).get(path)
      raise "#{name}: HTTP #{response.status}" unless response.status == 200
      expected = File.binread(File.join(CmuWebKilt::SOURCE_ROOT, name.end_with?('.css') ? 'css' : 'js', name))
      raise "#{name}: asset content differs" unless response.body == expected

      [name, path]
    end
    app.assets.processor.process
    result[:manifest] = JSON.parse(File.read(app.config.assets.manifest_path))
  end
  if app.respond_to?(:importmap) && app.importmap
    result[:importmap] = JSON.parse(app.importmap.to_json(resolver: ActionController::Base.helpers))
  end
  puts JSON.generate(result)
end
