# frozen_string_literal: true

require 'minitest/autorun'
require 'open3'
require 'json'
require 'rbconfig'
require 'nokogiri'

# The kit's layout, helpers and hooks, in a small app (layout_app.rb)
class LayoutTest < Minitest::Test
  ROOT = File.expand_path('..', __dir__)
  FIXTURE = File.join(__dir__, 'layout_app.rb')
  PAGES = %w[/ /teams /teams/5 /heats /roll-times].freeze

  def setup
    @pages ||= self.class.pages_in('test')
  end

  def test_the_layout_has_the_site_the_roof_and_the_legal_info_link
    page = @pages.fetch('/')
    assert_equal 'Spring Carnival Sweepstakes - Carnegie Mellon University', page.at('title').text
    assert_equal 'Spring Carnival Sweepstakes', page.at('#sitename .sitetitle a').text
    assert_equal 'Teams, drivers, heats and roll times', page.at('#sitename h2').text
    assert_equal 'roof red invert', page.at('header .roof')['class']
    assert page.at('footer a[href="https://www.cmu.edu/legal/"]'), 'The footer has no Legal Info link'
    assert page.at('footer nav#nav'), 'The navigation is drawn in the footer'
    assert page.at('body.cmu-app'), 'The body has the app class'
  end

  def test_the_hooks_defaults_leave_out_what_the_app_doesnt_have
    page = @pages.fetch('/')
    # No signed-in user, no login route: no account and no Sign In
    assert_nil page.at('.roof .cmu-account')
    assert_nil page.at('.roof form.search')
    assert_nil page.at('body.cmu-acting-as')
    # Caution tape outside production
    assert page.at('.cmu-site-bar--tape')
  end

  def test_the_current_item_comes_from_the_address
    assert_equal ['Teams'], current_items('/teams')
    # The deepest item whose address holds the page's
    assert_equal ['Teams'], current_items('/teams/5')
    assert_empty current_items('/')
  end

  def test_a_view_names_its_item_when_the_address_cant
    assert_equal ['Teams'], current_items('/roll-times')
  end

  def test_hidden_items_and_a_hidden_sections_visible_pages
    labels = @pages.fetch('/').css('nav#nav > ul > li:not(.cmu-account-menu) > a').map(&:text)
    # Officials and Settings are hidden; Officials' Heats moves up a level
    assert_equal %w[Teams Drivers Heats], labels
    assert_equal ['Heats'], current_items('/heats')
  end

  def test_sign_out_is_a_button_that_sends_delete
    menu = self.class.pages_in('test', 'SIGNED_IN' => '1').fetch('/').at('nav#nav li.cmu-account-menu')
    form = menu.at('form[action="/logout"]')
    assert form, 'Sign Out has no form'
    assert_equal 'post', form['method']
    assert_equal 'delete', form.at('input[name="_method"]')['value']
    assert_equal 'Sign Out', form.at('button').text.strip
    assert_nil menu.css('a').find { |a| a.text.strip == 'Sign Out' }, 'Sign Out is still a link'
  end

  def test_the_google_tag_loads_in_production_only
    refute_match 'googletagmanager.com', @pages.fetch('/').to_html
    production = self.class.pages_in('production', 'GOOGLE_TAG' => 'GTM-TEST000').fetch('/')
    assert_match 'gtm.js?id=', production.to_html
    assert_match 'GTM-TEST000', production.at('noscript').to_html
    assert_nil production.at('.cmu-site-bar--tape'), 'No caution tape in production'
  end

  def test_the_menu_closed_setting_marks_the_body
    assert_nil @pages.fetch('/').at('body')['data-cmu-menu'], 'The menu is the template\'s by default'
    closed = self.class.pages_in('test', 'MENU_CLOSED' => '1').fetch('/')
    assert_equal 'closed', closed.at('body')['data-cmu-menu']
  end

  def test_an_error_is_an_alert_and_a_notice_is_a_status
    page = @pages.fetch('/roll-times')
    assert_equal 'status', page.at('.cmu-flash--success')['role']
    assert_equal 'alert', page.at('.cmu-flash--error')['role']
  end

  def test_a_view_sets_its_own_menu
    assert_equal 'closed', @pages.fetch('/roll-times').at('body')['data-cmu-menu']
  end

  def self.pages_in(environment, extra = {})
    @pages_in ||= {}
    @pages_in[[environment, extra]] ||= begin
      library = File.join(ROOT, 'lib')
      stdout, stderr, status = Open3.capture3(
        { 'RAILS_ENV' => environment, 'CMU_WEB_KILT_LIBRARY' => library }.merge(extra),
        RbConfig.ruby, '-I', library, FIXTURE, *PAGES, chdir: ROOT
      )
      raise "Layout fixture failed:\n#{stdout}\n#{stderr}" unless status.success?

      JSON.parse(stdout.lines.last).transform_values { |html| Nokogiri::HTML5(html) }
    end
  end

  private

  def current_items(path)
    @pages.fetch(path).css('nav#nav li.active > a').map(&:text)
  end
end
