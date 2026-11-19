# frozen_string_literal: true

module CmuWebKilt
  GEM_ROOT = File.expand_path('../..', __dir__)
  # A built gem carries copies of the kit's files and a VERSION file (rake
  # assets); a checkout of packages/rails uses the kit at the repository root
  SOURCE_ROOT = if File.file?(File.join(GEM_ROOT, 'VERSION'))
                  GEM_ROOT
                else
                  File.expand_path('../..', GEM_ROOT)
                end

  # One version for the gem, the browser files and the release tag
  VERSION = if SOURCE_ROOT == GEM_ROOT
              File.read(File.join(GEM_ROOT, 'VERSION')).strip
            else
              # Read without the json gem: a gemspec loads this before Bundler
              # picks the app's json version, so requiring it here clashes
              File.read(File.join(SOURCE_ROOT, 'package.json'))[/"version":\s*"([^"]+)"/, 1]
            end.freeze
end
