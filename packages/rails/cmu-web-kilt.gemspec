# frozen_string_literal: true

require_relative 'lib/cmu_web_kilt/version'

Gem::Specification.new do |spec|
  spec.name = 'cmu-web-kilt'
  spec.version = CmuWebKilt::VERSION
  spec.authors = ['Carnegie Mellon University']
  spec.summary = 'Carnegie Mellon Web Kilt assets for Rails applications'
  spec.description = 'Page and app components that extend Carnegie Mellon University\'s web template, packaged for the Rails asset pipeline.'
  spec.homepage = 'https://webkilt.andrew.cmu.edu/'
  spec.license = 'BSD-3-Clause'
  spec.required_ruby_version = '>= 3.2'

  # css/, js/, LICENSE and VERSION are copied in from the kit by rake assets
  spec.files = Dir['lib/**/*.rb', 'config/importmap.rb', 'css/*.css', 'js/*.js'] +
               %w[LICENSE README.md VERSION]
  spec.require_paths = ['lib']
  spec.metadata = {
    'source_code_uri' => 'https://github.com/cmu-web/cmu-web-kilt',
    'documentation_uri' => 'https://github.com/cmu-web/cmu-web-kilt/tree/main/packages/rails#readme',
    'bug_tracker_uri' => 'https://github.com/cmu-web/cmu-web-kilt/issues',
    'rubygems_mfa_required' => 'true'
  }

  spec.add_dependency 'railties', '>= 7.2', '< 9'
end
