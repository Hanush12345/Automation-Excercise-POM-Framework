@misc
Feature: Miscellaneous

  @smoke
  Scenario: TC07 - Test Cases page loads with the expected content
    Given I open the home page
    When I navigate to Test Cases via the header
    Then the Test Cases page should list at least one test case

  @regression
  Scenario: TC10 - Subscribe from the home page footer
    Given I open the home page
    When I scroll to the bottom of the home page
    Then the newsletter subscription widget should be visible on the home page
    When I subscribe with a random email on the home page
    Then the subscription should be confirmed on the home page

  @regression
  Scenario: TC11 - Subscribe from the cart page footer
    Given I open the home page
    When I open the cart
    Then the cart should be displayed
    When I scroll to the bottom of the cart page
    Then the newsletter subscription widget should be visible on the cart page
    When I subscribe with a random email on the cart page
    Then the subscription should be confirmed on the cart page

  @regression
  Scenario: TC25 - Scroll up using the arrow button
    Given I open the home page
    Then the home page should be displayed
    When I scroll to the bottom of the home page
    Then the newsletter subscription widget should be in view
    And the vertical scroll position should be greater than zero
    And the scroll-up arrow should be visible
    When I click the scroll-up arrow
    Then the vertical scroll position should be zero
    And the hero heading should be back in view

  @regression
  Scenario: TC26 - Scroll up without the arrow button
    Given I open the home page
    Then the home page should be displayed
    When I scroll to the bottom of the home page
    Then the newsletter subscription widget should be in view
    When I scroll back to the top without using the arrow
    Then the vertical scroll position should be zero
    And the hero heading should be back in view
