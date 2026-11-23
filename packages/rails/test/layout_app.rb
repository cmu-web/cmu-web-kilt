# frozen_string_literal: true

# A small app on the kit's layout, run in a separate process: it renders the
# pages named on the command line and prints them as JSON. RAILS_ENV and
# GOOGLE_TAG set the environment and the Google tag.
require 'tmpdir'
require 'fileutils'
require 'json'
require 'logger'
require 'action_controller/railtie'
require 'propshaft'
require 'importmap-rails'
require File.join(ENV.fetch('CMU_WEB_KILT_LIBRARY'), 'cmu-web-kilt')
require 'rack/mock'

Dir.mktmpdir('cmu-web-kilt-layout') do |directory|
  FileUtils.mkdir_p(File.join(directory, 'config'))
  File.write(File.join(directory, 'config/importmap.rb'), '')

  app_class = Class.new(Rails::Application) do
    config.root = directory
    config.eager_load = false
    config.secret_key_base = 'cmu-web-kilt-test-secret'
    config.logger = Logger.new(File::NULL)
    config.hosts.clear
    config.action_dispatch.show_exceptions = :none
    # Production reads assets from a precompiled manifest; here they're
    # served from the load path, as in development
    config.assets.server = true if config.respond_to?(:assets)
  end
  app = app_class.instance

  CmuWebKilt.configure do |config|
    config.site_name = 'Spring Carnival Sweepstakes'
    config.tagline = 'Teams, drivers, heats and roll times'
    config.roof = :red
    config.google_tag = ENV.fetch('GOOGLE_TAG', nil)
    # No stylesheet of its own
    config.stylesheets = []
  end

  app.initialize!
  app.routes.draw do
    root to: 'pages#show'
    get 'teams', to: 'pages#show'
    get 'teams/:id', to: 'pages#show'
    get 'drivers', to: 'pages#show'
    get 'heats', to: 'pages#show'
    get 'roll-times', to: 'pages#roll_times'
    # Signed in: Sign Out by GET (a link) or DELETE (the menu's button)
    if ENV['SIGNED_IN']
      get 'logout', to: 'pages#show'
      delete 'logout', to: 'pages#show'
    end
  end

  # The app's hooks, as an app's CmuHelper defines them
  hooks = Module.new do
    def cmu_user
      Struct.new(:name, :andrew_id).new('Andrew Carnegie', 'ac00') if ENV['SIGNED_IN']
    end

    def cmu_nav_tree
      [
        { label: 'Teams', url: '/teams' },
        { label: 'Drivers', url: '/drivers' },
        # A section this user can't see: its visible page moves up a level
        { label: 'Officials', url: '/officials', if: -> { false },
          children: [{ label: 'Heats', url: '/heats' }] },
        { label: 'Settings', url: '/settings', secondary: true, if: -> { false } }
      ]
    end
  end

  pages = Class.new(ActionController::Base) do
    layout 'cmu/application'
    helper hooks

    def show
      render inline: '<p>Page</p>', layout: true
    end

    # A page whose address isn't under its tab names the tab, and shows a
    # notice and an error
    def roll_times
      flash.now[:notice] = 'Heat saved.'
      flash.now[:alert] = 'That heat is full.'
      render inline: '<% cmu_nav "teams" %><p>Roll times</p>', layout: true
    end
  end
  Object.const_set(:PagesController, pages)

  result = ARGV.to_h do |path|
    response = Rack::MockRequest.new(app).get(path)
    raise "#{path}: HTTP #{response.status}\n#{response.body}" unless response.status == 200

    [path, response.body]
  end
  puts JSON.generate(result)
end
