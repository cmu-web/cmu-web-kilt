# frozen_string_literal: true

require 'minitest/autorun'
require_relative '../lib/cmu_web_kilt/andrew_account'

# The Andrew ID comes from the sign-in name the identity provider vouches
# for, never from an email address
class AndrewAccountTest < Minitest::Test
  TENANT = 'cmu-tenant'

  def test_an_andrew_account
    assert_equal 'ac00', CmuWebKilt::AndrewAccount.id('ac00@andrew.cmu.edu')
    assert_equal 'ac00', CmuWebKilt::AndrewAccount.id(' AC00@Andrew.CMU.edu ')
  end

  def test_anything_else_is_refused
    ['ac00@gmail.com', 'andrew.carnegie@cmu.edu', 'ac00@evilandrew.cmu.edu', 'ac00@andrew.cmu.edu.example',
     'ac00@andrew.cmu.edu@gmail.com', '@andrew.cmu.edu', 'ac.00@andrew.cmu.edu', '', nil].each do |name|
      assert_nil CmuWebKilt::AndrewAccount.id(name), "#{name.inspect} was let in"
    end
  end

  def test_entra_needs_cmus_tenant_and_reads_the_sign_in_name_not_the_email
    assert_equal 'ac00', CmuWebKilt::AndrewAccount.from_entra(entra('ac00@andrew.cmu.edu'), tenant_id: TENANT)
    assert_nil CmuWebKilt::AndrewAccount.from_entra(entra('ac00@andrew.cmu.edu', tid: 'another'), tenant_id: TENANT)
    assert_nil CmuWebKilt::AndrewAccount.from_entra(entra('ac00@andrew.cmu.edu'), tenant_id: nil)
    guest = entra('ac00@gmail.com', email: 'ac00@andrew.cmu.edu')
    assert_nil CmuWebKilt::AndrewAccount.from_entra(guest, tenant_id: TENANT)
  end

  def test_saml_reads_the_eppn
    assert_equal 'mm00', CmuWebKilt::AndrewAccount.from_saml({ 'info' => { 'eppn' => 'mm00@andrew.cmu.edu' } })
    assert_nil CmuWebKilt::AndrewAccount.from_saml({ 'info' => { 'email' => 'mm00@andrew.cmu.edu' } })
  end

  private

  def entra(name, tid: TENANT, email: name)
    { 'info' => { 'email' => email }, 'extra' => { 'raw_info' => { 'tid' => tid, 'preferred_username' => name } } }
  end
end
