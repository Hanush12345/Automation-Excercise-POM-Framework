@contact
Feature: Contact Us

  @smoke @regression
  Scenario: TC06 - Submit the Contact Us form with an attachment
    Given I open the home page
    When I navigate to Contact Us via the header
    Then the "Get In Touch" section should be visible
    When I fill in the contact form with a random message and an attachment
    And I submit the form and accept the confirmation dialog
    Then the submission should be confirmed
    When I click the Home button
    Then the home page should be displayed
