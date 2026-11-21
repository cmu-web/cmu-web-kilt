# frozen_string_literal: true

# Runs the install generator in a throwaway app, in a separate process, and
# prints the files it wrote as JSON. The arguments are the generator's
# options. Nothing is installed: --skip-bundle keeps it off the network.
require 'tmpdir'
require 'fileutils'
require 'json'
require 'logger'
require 'action_controller/railtie'
# As in a new Rails app, which the settings' stylesheets depend on
require 'propshaft'
require File.join(ENV.fetch('CMU_WEB_KILT_LIBRARY'), 'cmu-web-kilt')

Dir.mktmpdir('cmu-web-kilt-generator') do |directory|
  {
    'Gemfile' => %(source "https://rubygems.org"\n\ngem "rails"\n),
    'config/routes.rb' => "Rails.application.routes.draw do\nend\n",
    'app/controllers/application_controller.rb' => "class ApplicationController < ActionController::Base\nend\n",
    'app/javascript/application.js' => %(import "@hotwired/turbo-rails"\n),
    'test/test_helper.rb' => %(ENV["RAILS_ENV"] ||= "test"\n)
  }.each do |path, contents|
    FileUtils.mkdir_p(File.join(directory, File.dirname(path)))
    File.write(File.join(directory, path), contents)
  end

  app_class = Class.new(Rails::Application) do
    config.root = directory
    config.eager_load = false
    config.secret_key_base = 'cmu-web-kilt-test-secret'
    config.logger = Logger.new(File::NULL)
  end
  # The generator names the site after the app's module by default
  Object.const_set(:SpringCarnivalSweepstakes, Module.new)
  SpringCarnivalSweepstakes.const_set(:Application, app_class)
  app_class.instance.initialize!

  require 'rails/generators'
  require 'generators/cmu_web_kilt/install/install_generator'
  $stdout = File.open(File::NULL, 'w')
  CmuWebKilt::Generators::InstallGenerator.start([*ARGV, '--skip-bundle'], destination_root: directory)
  $stdout = STDOUT

  files = Dir.glob('**/*', base: directory).select { |path| File.file?(File.join(directory, path)) }
  puts JSON.generate(files.sort.to_h { |path| [path, File.read(File.join(directory, path))] })
end
