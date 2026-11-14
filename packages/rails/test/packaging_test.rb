# frozen_string_literal: true

require 'minitest/autorun'
require 'rubygems/package'
require 'tmpdir'
require 'open3'
require 'json'
require 'rbconfig'
require_relative '../lib/cmu_web_kilt/version'

class PackagingTest < Minitest::Test
  ROOT = File.expand_path('..', __dir__)
  KIT = File.expand_path('../../..', __dir__)
  FIXTURE = File.join(__dir__, 'rails_app.rb')

  def test_gem_contains_the_canonical_assets_and_license
    with_package do |package, directory|
      package.extract_files(directory)
      %w[css/cmu-cms.css css/cmu-app.css js/cmu-app.js LICENSE].each do |file|
        assert_equal File.binread(File.join(KIT, file)), File.binread(File.join(directory, file))
      end
      assert File.file?(File.join(directory, 'lib/cmu_web_kilt/engine.rb'))
      assert File.file?(File.join(directory, 'config/importmap.rb'))
      refute package.spec.files.any? { |file| file.start_with?('docs/', 'node_modules/', 'test/') }
      version = JSON.parse(File.read(File.join(KIT, 'package.json'))).fetch('version')
      assert_equal version, package.spec.version.to_s
      assert_equal version, File.read(File.join(directory, 'VERSION')).strip
    end
  end

  def test_built_gem_serves_and_precompiles_assets_and_provides_importmap_pin
    with_package do |package, directory|
      package.extract_files(directory)
      result = boot(File.join(directory, 'lib'))
      assert_equal CmuWebKilt::VERSION, result.fetch('version')
      assert_equal directory, result.fetch('gem_root'), 'Rails must load the unpacked gem, not the source checkout'
      %w[cmu-cms.css cmu-app.css cmu-app.js].each do |name|
        assert_match %r{\A/assets/}, result.fetch('assets').fetch(name)
        assert result.fetch('manifest').key?(name), "#{name} was not precompiled"
      end
      assert_equal result.fetch('assets').fetch('cmu-app.js'), result.fetch('importmap').fetch('imports').fetch('cmu-web-kilt')
    end
  end

  def test_rails_boots_without_importmap
    result = boot(File.join(ROOT, 'lib'), 'WITHOUT_IMPORTMAP' => '1')
    assert result.fetch('assets').key?('cmu-app.js')
    refute result.key?('importmap')
  end

  def test_rails_boots_without_an_asset_pipeline
    result = boot(File.join(ROOT, 'lib'), 'WITHOUT_ASSETS' => '1', 'WITHOUT_IMPORTMAP' => '1')
    assert_equal CmuWebKilt::VERSION, result.fetch('version')
    refute result.key?('assets')
  end

  def test_application_importmap_pin_takes_precedence
    result = boot(File.join(ROOT, 'lib'), 'OVERRIDE_PIN' => '1')
    assert_equal 'https://example.test/override.js', result.fetch('importmap').fetch('imports').fetch('cmu-web-kilt')
  end

  private

  def boot(library, environment = {})
    stdout, stderr, status = Open3.capture3(
      { 'RAILS_ENV' => 'test', 'CMU_WEB_KILT_LIBRARY' => library }.merge(environment),
      RbConfig.ruby, '-I', library, FIXTURE, chdir: ROOT
    )
    assert status.success?, "Rails fixture failed:\n#{stdout}\n#{stderr}"
    JSON.parse(stdout.lines.last)
  end

  def with_package
    Dir.mktmpdir('cmu-web-kilt-gem') do |directory|
      file = File.join(directory, "cmu-web-kilt-#{CmuWebKilt::VERSION}.gem")
      capture_io { Gem::Package.build(Gem::Specification.load(File.join(ROOT, 'cmu-web-kilt.gemspec')), false, true, file) }
      yield Gem::Package.new(file), File.join(directory, 'unpacked')
    end
  end
end
