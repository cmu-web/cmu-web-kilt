# frozen_string_literal: true

module CmuWebKilt
  # The site's navigation: one list, drawn in the footer as nav#nav, which
  # the template's script copies into the header tabs and the menu. The
  # layout draws it on every page from the app's cmu_nav_tree.
  #
  # The current item comes from the page's address: the deepest item whose
  # address holds the page's (/tools holds /tools/5, not /toolsets). A view
  # whose address doesn't match its item names it: <% cmu_nav "tools" %>.
  module NavigationHelper
    Item = Data.define(:label, :url, :key, :secondary, :children)

    # Name the current item by its key, when the address alone can't
    def cmu_nav(key)
      content_for(:cmu_nav_current, key.to_s, flush: true)
      nil
    end

    # The items this user sees, with their sub-lists. A hidden item's
    # visible pages move up to its level, so hiding a section doesn't hide
    # pages the user may open.
    def cmu_nav_items(items = cmu_nav_tree)
      items.flat_map do |item|
        children = cmu_nav_items(item.fetch(:children, []))
        test = item[:if]
        next children if test && !instance_exec(&test)

        [Item.new(label: item.fetch(:label), url: item.fetch(:url),
                  key: (item[:key] || item.fetch(:label).parameterize(separator: '_')).to_s,
                  secondary: item.fetch(:secondary, false), children:)]
      end
    end

    # The current item's key: the one a view named, if the user sees it, or
    # else the one the address finds
    def cmu_nav_current(items = cmu_nav_items)
      key = content_for(:cmu_nav_current).presence
      named = key && cmu_nav_flatten(items).find { |item| item.key == key }
      (named || cmu_nav_match(items))&.key
    end

    private

    def cmu_nav_match(items)
      path = request.path
      cmu_nav_flatten(items)
        .select { |item| path == item.url || path.start_with?("#{item.url.chomp('/')}/") }
        .max_by { |item| item.url.length }
    end

    def cmu_nav_flatten(items)
      items.flat_map { |item| [item, *cmu_nav_flatten(item.children)] }
    end
  end
end
