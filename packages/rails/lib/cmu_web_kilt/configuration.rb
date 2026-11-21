# frozen_string_literal: true

module CmuWebKilt
  # An app's site settings, for the kit's layout. Set them in
  # config/initializers/cmu_web_kilt.rb (the install generator writes it):
  #
  #   CmuWebKilt.configure do |config|
  #     config.site_name = "Spring Carnival Sweepstakes"
  #   end
  class Configuration
    ROOFS = { white: nil, red: 'red invert', gray: 'darkgrey invert' }.freeze

    # The site's name, in the header, the footer, the page title and the
    # first breadcrumb
    attr_accessor :site_name
    # A line under the name, in sentence case; nil for none
    attr_accessor :tagline
    # The roof: :white, :red or :gray
    attr_accessor :roof
    # A logo beside the site name (an image in app/assets/images), the words
    # that say where its link goes, and that link
    attr_accessor :logo, :logo_alt, :logo_url
    # The footer's address lines, under the site name
    attr_accessor :footer_lines
    # The contact address shown in the footer and on the sign-in page; nil
    # for none
    attr_accessor :contact_email
    # The site's own icon (an image in app/assets/images); nil for CMU's
    attr_accessor :favicon
    # A Google Tag Manager container (GTM-...), loaded in production only;
    # nil for none
    attr_accessor :google_tag
    # The app's own stylesheets, after the kit's: names for
    # stylesheet_link_tag, or :app for all of app/assets/stylesheets
    # (Propshaft 1.0 and later)
    attr_accessor :stylesheets

    def initialize
      @site_name = 'Carnegie Mellon University'
      @roof = :white
      @stylesheets = ['application']
      @footer_lines = ['Carnegie Mellon University', '5000 Forbes Avenue', 'Pittsburgh, PA 15213']
    end

    # The roof's classes for its color
    def roof_class
      ROOFS.fetch(roof.to_sym) { raise ArgumentError, "roof is #{roof.inspect}: use :white, :red or :gray" }
    end
  end

  def self.config
    @config ||= Configuration.new
  end

  def self.configure
    yield config
  end
end
