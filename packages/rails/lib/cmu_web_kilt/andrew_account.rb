# frozen_string_literal: true

module CmuWebKilt
  # The Andrew ID someone signed in with, from the sign-in name the identity
  # provider vouches for: ac00@andrew.cmu.edu gives ac00. Anything else gives
  # nil, so the app refuses it: a guest account's own address
  # (ac00@gmail.com), an @cmu.edu alias (andrew.carnegie@cmu.edu), another
  # domain that merely ends the same way, or no name at all. An email
  # address is never the source: Entra doesn't verify it, and a guest sets
  # their own.
  module AndrewAccount
    DOMAIN = 'andrew.cmu.edu'
    ID = /\A[a-z0-9]+\z/

    module_function

    # The ID from a sign-in name, or nil
    def id(sign_in_name)
      local, domain, rest = sign_in_name.to_s.strip.downcase.split('@', 3)
      return unless rest.nil? && domain == DOMAIN && local.to_s.match?(ID)

      local
    end

    # From an Entra ID sign-in (omniauth-entra-id): the sign-in name
    # (preferred_username) of an account in CMU's tenant only. Without a
    # tenant to check against, no one is let in.
    def from_entra(auth, tenant_id:)
      claims = auth.to_hash.dig('extra', 'raw_info') || {}
      return if tenant_id.to_s.empty? || claims['tid'] != tenant_id

      id(claims['preferred_username'])
    end

    # From a SAML sign-in (omniauth-saml): eduPersonPrincipalName, which the
    # install generator's config/initializers/omniauth.rb maps to info.eppn
    def from_saml(auth)
      id(auth.to_hash.dig('info', 'eppn'))
    end
  end
end
