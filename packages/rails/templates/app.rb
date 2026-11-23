# frozen_string_literal: true

# Rails application template for an app on the Carnegie Mellon Web Kilt:
#
#   rails new my-app -m https://cdn.jsdelivr.net/gh/cmu-web/cmu-web-kilt@0.8.28/packages/rails/templates/app.rb
#
# It adds the cmu-web-kilt gem at this release, runs its install generator
# (which asks for the site name, tabs, roof and sign-in), and adds CMU Web's
# shared RuboCop and erb_lint settings (the cmu-web-style gem) and an
# erb_lint step to the CI workflow Rails writes. Answers can be given ahead,
# for scripts: CMU_SITE_NAME, CMU_TAGLINE, CMU_TABS, CMU_ROOF and
# CMU_SIGN_IN.

require 'shellwords'

KILT_VERSION = '0.8.28'

if ENV['CMU_WEB_KILT_PATH']
  # A checkout of the kit's Rails package, for working on the kit
  gem 'cmu-web-kilt', path: ENV['CMU_WEB_KILT_PATH']
else
  gem 'cmu-web-kilt', KILT_VERSION
end

# CMU Web's shared lint settings, with rubocop-rails-omakase and erb_lint
gem_group :development, :test do
  if ENV['CMU_WEB_STYLE_PATH']
    gem 'cmu-web-style', path: ENV['CMU_WEB_STYLE_PATH'], require: false
  else
    gem 'cmu-web-style', require: false
  end
end

after_bundle do
  answers = {
    'site-name' => ENV.fetch('CMU_SITE_NAME', nil),
    'tagline' => ENV.fetch('CMU_TAGLINE', nil),
    'tabs' => ENV.fetch('CMU_TABS', nil),
    'roof' => ENV.fetch('CMU_ROOF', nil),
    'sign-in' => ENV.fetch('CMU_SIGN_IN', nil)
  }.compact
  # A new app's layout and test helper are Rails' defaults, so replace them
  # without asking
  # generate runs a shell command, so quote each answer
  generate 'cmu_web_kilt:install', '--force', *answers.map { |name, value| Shellwords.escape("--#{name}=#{value}") }

  create_file '.rubocop.yml', <<~YAML, force: true
    # CMU Web's shared settings (cmu-web-style): Rails' own style, and the
    # files no app lints. Add the app's own rules under them.
    inherit_gem:
      cmu-web-style: config/rubocop.yml
  YAML
  create_file '.erb_lint.yml', <<~YAML
    inherit_gem:
      cmu-web-style: config/erb_lint.yml
  YAML

  ci = '.github/workflows/ci.yml'
  if File.exist?(ci)
    inject_into_file ci, after: "        run: bin/rubocop -f github\n" do
      <<~YAML.indent(6)

        - name: Lint views
          run: bundle exec erb_lint --lint-all
      YAML
    end
  end

  rails_command 'db:prepare'
end
