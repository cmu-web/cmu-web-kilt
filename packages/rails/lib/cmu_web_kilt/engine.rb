# frozen_string_literal: true

require 'rails'
require 'rails/engine'

module CmuWebKilt
  class Engine < ::Rails::Engine
    initializer 'cmu_web_kilt.assets', before: :load_config_initializers do |app|
      next unless app.config.respond_to?(:assets)

      # The kit's own css/ and js/: copies in a built gem, the repository's
      # in a checkout
      app.config.assets.paths << File.join(SOURCE_ROOT, 'css')
      app.config.assets.paths << File.join(SOURCE_ROOT, 'js')
      app.config.assets.precompile += %w[cmu-cms.css cmu-app.css cmu-app.js]
    end

    initializer 'cmu_web_kilt.importmap', before: 'importmap' do |app|
      next unless app.config.respond_to?(:importmap)

      app.config.importmap.paths << root.join('config/importmap.rb')
      app.config.importmap.cache_sweepers << File.join(SOURCE_ROOT, 'js')
    end
  end
end
