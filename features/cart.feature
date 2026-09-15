@cart
Feature: Shopping cart

  @smoke @regression
  Scenario: TC12 - Add multiple products to the cart
    Given I open the home page
    When I navigate to Products via the header
    Then I should see the "All Products" heading
    When I add the first 2 products to the cart
    And I open the cart
    Then the cart should be displayed
    And the cart should contain 2 items
    And each added product should be in the cart with the correct price and quantity

  @regression
  Scenario: TC13 - Product quantity set on the detail page persists in the cart
    Given I open the product detail page for the Blue Top product
    When I set the quantity to 4 and add it to the cart
    Then the cart should be displayed
    And the cart should show a quantity of 4 for that product
    And the line total should equal the price times the quantity

  @regression
  Scenario: TC17 - Remove a product from the cart
    Given I open the home page
    When I navigate to Products via the header
    And I add the first 1 products to the cart
    And I open the cart
    Then the cart should be displayed
    And the first added product should be in the cart
    When I remove the first added product from the cart
    Then that product should no longer appear in the cart
    And the cart should be empty

  @regression @account
  Scenario: TC20 - Cart contents survive logout and login
    Given I have registered a new account
    And I log out
    When I navigate to Products via the header
    And I search for "Top" and add up to 3 results to the cart
    And I open the cart
    Then the cart should be displayed
    And all the searched products should be in the cart
    When I navigate to Signup / Login
    And I log in with my registered credentials
    Then I should be logged in as my user
    When I open the cart
    Then the cart should be displayed
    And the cart should still contain all the searched products

  @regression
  Scenario: TC22 - Add to cart from Recommended Items
    Given I open the home page
    When I add a recommended product from the home page to the cart
    Then the cart should be displayed
    And the recommended product should appear in the cart
