# frozen_string_literal: true

require 'minitest/autorun'
require 'open3'
require 'json'
require 'rbconfig'

# The install generator, run with options in a throwaway app
# (generator_app.rb), for each way to sign in
class GeneratorTest < Minitest::Test
  ROOT = File.expand_path('..', __dir__)
  FIXTURE = File.join(__dir__, 'generator_app.rb')
  OPTIONS = ['--site-name=Spring Carnival Sweepstakes', '--tabs=Teams,Drivers,Heats', '--roof=red'].freeze

  def test_entra_id
    files = generate('--sign-in=entra')
    assert_includes files.fetch('Gemfile'), 'gem "omniauth-entra-id"'
    assert_includes files.fetch('Gemfile'), 'gem "omniauth-rails_csrf_protection"'
    assert_includes files.fetch('config/initializers/omniauth.rb'), 'provider :entra_id'
    assert_includes files.fetch('app/controllers/sessions_controller.rb'),
                    'CmuWebKilt::AndrewAccount.from_entra(auth, tenant_id: ENV["ENTRA_TENANT_ID"])'
    refute_includes files.fetch('app/controllers/sessions_controller.rb'), 'info.email'
    assert_includes files.fetch('test/integration/cmu_layout_test.rb'), 'another-tenant'
    assert_includes files.fetch('config/routes.rb'), '"/auth/entra_id"'
    # Sign Out works as a link (GET) and as the menu's button (DELETE)
    assert_includes files.fetch('config/routes.rb'), 'get "logout", to: "sessions#destroy"'
    assert_includes files.fetch('config/routes.rb'), 'delete "logout", to: "sessions#destroy"'
  end

  def test_saml
    files = generate('--sign-in=saml')
    assert_includes files.fetch('Gemfile'), 'gem "omniauth-saml"'
    assert_includes files.fetch('config/initializers/omniauth.rb'), 'eduPersonPrincipalName'
    assert_includes files.fetch('app/controllers/sessions_controller.rb'), 'CmuWebKilt::AndrewAccount.from_saml(auth)'
  end

  def test_no_identity_provider
    files = generate('--sign-in=none')
    refute_includes files.fetch('Gemfile'), 'omniauth'
    refute files.key?('config/initializers/omniauth.rb')
    refute_includes files.fetch('app/controllers/sessions_controller.rb'), 'def create'
    # Without a provider, sign-in exists only in development and test
    assert_match(/if Rails\.env\.local\?\n\s+direct\(:login\)/, files.fetch('config/routes.rb'))
    assert_includes files.fetch('config/routes.rb'), 'delete "logout", to: "sessions#destroy"'
  end

  def test_without_developer_sign_in
    files = generate('--sign-in=none', '--no-dev-sign-in')
    refute files.key?('app/controllers/sessions_controller.rb')
    refute files.key?('app/controllers/dev_sessions_controller.rb')
    refute files.key?('config/test_accounts.yml')
  end

  def test_settings_layout_pages_and_script
    files = generate('--sign-in=entra')
    settings = files.fetch('config/initializers/cmu_web_kilt.rb')
    assert_includes settings, 'Spring Carnival Sweepstakes'
    assert_includes settings, ':red'
    # Propshaft 1.0 and later link all of the app's own stylesheets
    assert_includes settings, 'config.stylesheets = [ :app ]'
    assert_includes files.fetch('app/views/layouts/application.html.erb'), 'layouts/cmu/application'
    %w[teams drivers heats].each do |tab|
      assert files.key?("app/controllers/#{tab}_controller.rb"), "No page for #{tab}"
      assert_includes files.fetch('config/routes.rb'), "resources :#{tab}, only: :index"
    end
    assert_includes files.fetch('config/routes.rb'), 'root "home#index"'
    assert_includes files.fetch('app/javascript/application.js'), 'import "cmu-web-kilt"'
    assert_includes files.fetch('app/controllers/application_controller.rb'), 'include CmuSignIn'
    accounts = files.fetch('config/test_accounts.yml')
    assert_includes accounts, 'Andrew Carnegie'
    assert_includes accounts, 'ac00'
  end

  def test_the_ruby_it_writes_is_valid
    %w[entra saml none].each do |sign_in|
      generate("--sign-in=#{sign_in}").each do |path, source|
        next unless path.end_with?('.rb')

        RubyVM::InstructionSequence.compile(source, path)
      rescue SyntaxError => e
        flunk "#{sign_in}: #{path} isn't valid Ruby: #{e.message}"
      end
    end
  end

  private

  def generate(*options)
    @generated ||= {}
    @generated[options] ||= begin
      library = File.join(ROOT, 'lib')
      stdout, stderr, status = Open3.capture3(
        { 'RAILS_ENV' => 'development', 'CMU_WEB_KILT_LIBRARY' => library },
        RbConfig.ruby, '-I', library, FIXTURE, *OPTIONS, *options, chdir: ROOT
      )
      raise "Generator fixture failed:\n#{stdout}\n#{stderr}" unless status.success?

      JSON.parse(stdout.lines.last)
    end
  end
end
