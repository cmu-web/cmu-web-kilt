# frozen_string_literal: true

module CmuWebKilt
  # What the kit's layout asks of the app, with the defaults for an app that
  # doesn't say. Define any of these in an app helper to replace it; the
  # install generator writes app/helpers/cmu_helper.rb with the ones it uses.
  module HooksHelper
    # The signed-in user (anything with a name), or nil when signed out
    def cmu_user
      nil
    end

    # The navigation items, as data. Each is a hash: label:, url:, and
    # optional key:, secondary: (menu only), children: and if:, a lambda run
    # in the view that says whether the user sees it:
    #   { label: "Tools", url: tools_path, if: -> { can?(:index, Tool) } }
    def cmu_nav_tree
      []
    end

    # A link to the signed-in user's own page, in the menu; nil for none
    def cmu_profile_path
      nil
    end

    # The app's own search, in the roof; nil for none
    def cmu_search_path
      nil
    end

    # Whether an administrator is using the app as someone else
    # (cmu_user is that person), and where Stop sends a POST
    def cmu_acting_as?
      false
    end

    def cmu_stop_acting_path
      nil
    end

    # The test account signed in through developer sign-in, as
    # { name:, role: }, for the gold bar; nil otherwise
    def cmu_test_account
      nil
    end
  end
end
