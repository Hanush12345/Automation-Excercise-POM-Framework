@products
Feature: Product catalogue

  @smoke @regression
  Scenario: TC08 - All Products page and product detail page
    Given I open the home page
    When I navigate to Products via the header
    Then I should see the "All Products" heading
    And the product list should not be empty
    When I open the first product from the list
    Then the product detail URL should contain "/product_details/"
    And all product detail fields should be visible and populated

  @regression
  Scenario: TC09 - Search returns only matching products
    Given I open the home page
    When I navigate to Products via the header
    Then I should see the "All Products" heading
    When I search for "Top"
    Then the "Searched Products" heading should be visible
    And the results should include products matching "Top"

  @regression
  Scenario: TC18 - View products by category
    Given I open the home page
    Then the category sidebar should be visible
    When I select the "Women" > "Dress" subcategory
    Then the category page title should contain "Women - Dress Products"
    And the product list should not be empty
    When I select the "Men" > "Tshirts" subcategory
    Then the category page title should contain "Men - Tshirts Products"
    And the product list should not be empty

  @regression
  Scenario: TC19 - View and navigate brand products
    Given I open the home page
    When I navigate to Products via the header
    Then the brands panel should be visible
    When I select the first brand from the sidebar
    Then the brand product URL should contain "/brand_products/"
    And the product list should not be empty
    When I switch to the second brand from the sidebar
    Then the brand product URL should contain "/brand_products/"
    And the product list should not be empty

  @regression
  Scenario: TC21 - Add a review on a product
    Given I open the home page
    When I navigate to Products via the header
    Then I should see the "All Products" heading
    When I open the first product from the list
    Then the "Write a Review" tab should be visible
    When I submit a random product review
    Then the review submission should be confirmed
