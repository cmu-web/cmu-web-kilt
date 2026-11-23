# frozen_string_literal: true

require 'rails/generators'

module CmuWebKilt
  module Generators
    # Sets up a Rails app on the Carnegie Mellon Web Kilt: the kit's layout,
    # the site's settings and navigation, sign-in and developer sign-in.
    #
    #   bin/rails generate cmu_web_kilt:install
    #   bin/rails generate cmu_web_kilt:install --site-name="Spring Carnival Sweepstakes" \
    #     --tabs="Teams,Drivers,Heats" --sign-in=entra
    #
    # It asks for anything not given as an option, and uses the defaults
    # when there's no one at the terminal to ask. Run again after an
    # upgrade, it shows a diff for each file the app changed before
    # replacing it.
    class InstallGenerator < Rails::Generators::Base
      source_root File.expand_path('templates', __dir__)

      SIGN_INS = {
        'entra' => { gem: 'omniauth-entra-id', provider: 'entra_id' },
        'saml' => { gem: 'omniauth-saml', provider: 'saml' },
        'none' => nil
      }.freeze

      class_option :site_name, type: :string, desc: "The site's name, in the header and the page title"
      class_option :tagline, type: :string, desc: 'A line under the name, in sentence case'
      class_option :tabs, type: :string, desc: "The navigation's tabs, comma-separated, such as Programs,People"
      class_option :roof, type: :string, desc: "The roof's color: white, red or gray"
      class_option :sign_in, type: :string, desc: 'How people sign in: entra, saml or none'
      class_option :skip_bundle, type: :boolean, default: false,
                                 desc: "Don't run bundle install after adding the sign-in gems"
      class_option :dev_sign_in, type: :boolean, default: true,
                                 desc: 'Add developer sign-in, with test accounts, for development and test'

      def ask_questions
        @site_name = answer(:site_name, 'Site name?', Rails.application.class.module_parent_name.titleize)
        @tagline = answer(:tagline, 'Tagline (sentence case; Enter for none)?', '')
        @tabs = answer(:tabs, 'Tabs (comma-separated; Enter for none)?', '')
                .split(',').map(&:strip).compact_blank.map { |label| tab(label) }
        @roof = answer(:roof, 'Roof (white, red or gray)?', 'white', %w[white red gray])
        @sign_in = answer(:sign_in, 'Sign-in (entra, saml or none)?', 'entra', SIGN_INS.keys)
      end

      def settings
        template 'cmu_web_kilt.rb.tt', 'config/initializers/cmu_web_kilt.rb'
      end

      def layout
        copy_file 'application.html.erb', 'app/views/layouts/application.html.erb'
      end

      # The kit's script, for its components (initials, countdowns, copy
      # buttons and the rest): through the import map, after Turbo
      def script
        javascript = 'app/javascript/application.js'
        return unless File.exist?(File.join(destination_root, javascript))
        return if File.read(File.join(destination_root, javascript)).include?('"cmu-web-kilt"')

        append_to_file javascript, %(import "cmu-web-kilt"\n)
      end

      def helpers
        template 'cmu_helper.rb.tt', 'app/helpers/cmu_helper.rb'
        template 'navigation_items_helper.rb.tt', 'app/helpers/navigation_items_helper.rb'
      end

      def home_page
        return if routes.named_routes.key?(:root)

        template 'home_controller.rb.tt', 'app/controllers/home_controller.rb'
        template 'home_index.html.erb.tt', 'app/views/home/index.html.erb'
        route 'root "home#index"'
      end

      def tab_pages
        @tabs.each do |tab|
          next if routes.named_routes.key?(tab[:route].to_sym)

          @tab = tab
          template 'tab_controller.rb.tt', "app/controllers/#{tab[:route]}_controller.rb"
          template 'tab_index.html.erb.tt', "app/views/#{tab[:route]}/index.html.erb"
          route "resources :#{tab[:route]}, only: :index"
        end
      end

      def who_is_signed_in
        current = File.join(destination_root, 'app/models/current.rb')
        if !File.exist?(current)
          template 'current.rb.tt', 'app/models/current.rb'
        elsif !File.read(current).match?(/attribute.*:user\b/)
          inject_into_class 'app/models/current.rb', 'Current', "  attribute :user\n"
        end
        template 'signed_in_user.rb.tt', 'app/models/signed_in_user.rb'
        template 'cmu_sign_in.rb.tt', 'app/controllers/concerns/cmu_sign_in.rb'
        inject_into_class 'app/controllers/application_controller.rb', 'ApplicationController',
                          "  include CmuSignIn\n"
      end

      def sign_in
        sign_in = SIGN_INS[@sign_in]
        return unless sign_in || options[:dev_sign_in]

        @provider = sign_in&.dig(:provider)
        template 'sessions_controller.rb.tt', 'app/controllers/sessions_controller.rb'
        route sign_in_routes
        return unless sign_in

        gem 'omniauth'
        gem 'omniauth-rails_csrf_protection'
        gem sign_in[:gem]
        template 'omniauth.rb.tt', 'config/initializers/omniauth.rb'
        @bundle = true
      end

      def dev_sign_in
        return unless options[:dev_sign_in]

        template 'dev_sessions_controller.rb.tt', 'app/controllers/dev_sessions_controller.rb'
        template 'dev_sessions_new.html.erb.tt', 'app/views/dev_sessions/new.html.erb'
        template 'test_accounts.yml.tt', 'config/test_accounts.yml'
        route <<~RUBY
          # Developer sign-in, at /login: drawn only in development and test
          # (DevSessionsController refuses everywhere else too)
          if Rails.env.local?
            match "login", to: "dev_sessions#new", as: :dev_login, via: %i[get post]
            post "login/:andrew_id", to: "dev_sessions#create", as: :dev_login_as
          end
        RUBY
      end

      def tests
        template 'cmu_layout_test.rb.tt', 'test/integration/cmu_layout_test.rb'
        append_to_file 'test/test_helper.rb', <<~RUBY

          # Draw the routes now, as the test environment. Rails 8 draws them on
          # the first request; if that comes inside with_rails_env("production"),
          # the developer sign-in routes are left out for the rest of the run.
          if Rails.application.respond_to?(:reload_routes_unless_loaded)
            Rails.application.reload_routes_unless_loaded
          end

          # Run a block as if Rails were in another environment, such as production
          def with_rails_env(name)
            original = Rails.env
            Rails.env = name
            yield
          ensure
            Rails.env = original
          end
        RUBY
      end

      def finish
        # Outside the generator's own Bundler setup, which still has the old
        # Gemfile's gems, as Rails' generators do
        Bundler.with_original_env { run 'bundle install' } if @bundle && !options[:skip_bundle]
        say "\nThe Carnegie Mellon Web Kilt is set up.", :green
        say "Sign-in: set #{env_names.join(', ')} before using it outside development." if env_names.any?
      end

      private

      # An option's value, or the answer to a question, or the default when
      # no one is at the terminal
      def answer(name, question, default, choices = nil)
        value = options[name]
        value = ask(question, default: default, limited_to: choices).to_s if value.nil? && $stdin.tty?
        value = default if value.nil?
        value = value.to_s.strip
        if choices && !choices.include?(value)
          raise Thor::Error, "--#{name.to_s.dasherize} is #{value.inspect}: use #{choices.join(', ')}"
        end

        value
      end

      def tab(label)
        { label:, route: label.parameterize(separator: '_') }
      end

      # Rails 8 draws routes on first use; Rails 7.2 draws them at boot
      def routes
        app = Rails.application
        app.reload_routes_unless_loaded if app.respond_to?(:reload_routes_unless_loaded)
        app.routes
      end

      # Without an identity provider, developer sign-in is the only way in,
      # so the routes exist only in development and test
      def sign_in_routes
        if @provider.nil?
          return <<~RUBY
            # Sign-in (cmu-web-kilt): developer sign-in only, in development and test
            if Rails.env.local?
              direct(:login) { "/login" }
              get "logout", to: "sessions#destroy"
              delete "logout", to: "sessions#destroy"
            end
          RUBY
        end

        login = %("/auth/#{@provider}")
        login = %(Rails.env.local? ? "/login" : #{login}) if options[:dev_sign_in]
        <<~RUBY
          # Sign-in (cmu-web-kilt): #{if options[:dev_sign_in]
                                        'developer sign-in in development and test, '
                                      end}#{@provider} elsewhere
          direct(:login) { #{login} }
          match "auth/:provider/callback", to: "sessions#create", via: %i[get post]
          get "auth/failure", to: "sessions#failure"
          get "logout", to: "sessions#destroy"
          delete "logout", to: "sessions#destroy"
        RUBY
      end

      def env_names
        case @sign_in
        when 'entra' then %w[ENTRA_CLIENT_ID ENTRA_CLIENT_SECRET ENTRA_TENANT_ID]
        when 'saml' then %w[SAML_SP_ENTITY_ID SAML_IDP_SSO_URL SAML_IDP_CERT]
        else []
        end
      end
    end
  end
end
