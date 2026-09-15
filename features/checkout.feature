@checkout
Feature: Checkout

  @smoke @regression @account
  Scenario: TC14 - Register while checkout
    Given I open the home page
    When I navigate to Products via the header
    And I add the first 1 products to the cart
    And I open the cart
    Then the cart should be displayed
    When I proceed to checkout as a guest
    And I register a new account from inside the checkout flow
    And I open the cart
    And I place the order and pay

  @regression @account
  Scenario: TC15 - Register before checkout
    Given I have registered a new account
    When I navigate to Products via the header
    And I add the first 1 products to the cart
    And I open the cart
    And I place the order and pay

  @regression @account
  Scenario: TC16 - Login before checkout
    Given I have registered a new account
    And I log out
    When I log in with my registered credentials
    Then I should be logged in as my user
    When I navigate to Products via the header
    And I add the first 1 products to the cart
    And I open the cart
    And I place the order and pay

  @regression @account
  Scenario: TC23 - Delivery and billing addresses match the registration data
    Given I have registered a new account
    When I navigate to Products via the header
    And I add the first 1 products to the cart
    And I open the cart
    Then the cart should be displayed
    When I proceed to checkout
    Then the checkout page should be displayed
    And the delivery address should match my registration details
    And the billing address should match my registration details

  @regression @account
  Scenario: TC24 - Download the invoice after placing an order
    Given I have registered a new account
    When I navigate to Products via the header
    And I add the first 1 products to the cart
    And I open the cart
    And I place the order, pay, and download the invoice
    Then the invoice should download as a valid file
