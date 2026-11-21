# frozen_string_literal: true

module CmuWebKilt
  # The page's title, breadcrumbs and flash messages, for the kit's layout.
  # Views add to them; the layout draws them.
  module LayoutHelper
    TITLE_SEPARATOR = ' - '
    BREADCRUMB_SEPARATOR = '&nbsp;&rsaquo;&nbsp;'.html_safe

    # Add to the page's title, most specific first. In a view:
    #   <% cmu_title "Electrical", "Queues" %>
    # gives "Electrical - Queues - Site Name - Carnegie Mellon University".
    def cmu_title(*parts)
      title = safe_join([*parts.flatten.compact_blank, content_for(:cmu_title).presence].compact, TITLE_SEPARATOR)
      content_for(:cmu_title, title, flush: true)
      nil
    end

    def cmu_document_title
      site = CmuWebKilt.config.site_name
      parts = [content_for(:cmu_title).presence, site]
      parts << 'Carnegie Mellon University' unless site == 'Carnegie Mellon University'
      safe_join(parts.compact, TITLE_SEPARATOR)
    end

    # Add steps to the breadcrumbs, after the site name: earlier pages as
    # links, the current page last as text. In a view:
    #   <% cmu_breadcrumb link_to("Queues", queues_path), "Electrical" %>
    # A page without any has no breadcrumbs, as the home page shouldn't.
    def cmu_breadcrumb(*steps)
      steps.flatten.compact_blank.each do |step|
        content_for(:cmu_breadcrumbs, safe_join([BREADCRUMB_SEPARATOR, step]))
      end
      nil
    end

    def cmu_breadcrumb_trail
      steps = content_for(:cmu_breadcrumbs)
      return if steps.blank?

      safe_join([link_to(CmuWebKilt.config.site_name, main_app.root_path), steps])
    end

    # The kit's flash classes for Rails' flash names: notice and success are
    # green, alert and error red, anything else gold
    def cmu_flash_class(name)
      tone = case name.to_s
             when 'notice', 'success' then 'success'
             when 'alert', 'error' then 'error'
             else 'notice'
             end
      "cmu-flash cmu-flash--#{tone}"
    end

    # Whether the app has a route, such as login, for the parts of the
    # layout that need one
    def cmu_route?(name)
      main_app.respond_to?(:"#{name}_path")
    end
  end
end
