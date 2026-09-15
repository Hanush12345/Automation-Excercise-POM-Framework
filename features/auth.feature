@auth
Feature: Authentication

  @smoke @regression @account
  Scenario: TC01 - Register a new user end to end
    Given I open the home page
    Then the home page should be displayed
    When I navigate to Signup / Login
    Then the signup form should be visible
    When I start signup with a new random name and email
    Then the account information form should be pre-filled with my name and email
    When I complete the account and address information
    Then my account should be created
    And I should be logged in as my user
    When I delete my account
    Then the account deletion should be confirmed

  @regression @account
  Scenario: TC01a - Newly registered user name is reflected in the header
    Given I have registered a new account
    Then the header should show my name as logged in

  @smoke @regression @account
  Scenario: TC02 - Login with valid credentials
    Given I have registered a new account
    And I log out
    Then the login form should be visible
    When I log in with my registered credentials
    Then I should be logged in as my user

  @regression
  Scenario: TC03 - Login with invalid credentials shows an error
    Given I open the home page
    When I navigate to Signup / Login
    Then the login form should be visible
    When I log in with invalid credentials
    Then I should see an "incorrect credentials" error
    And I should be logged out

  @regression @account
  Scenario: TC04 - Logout returns the user to the login page
    Given I have registered a new account
    When I log out
    Then the login form should be visible
    And the current URL should contain "/login"
    And I should be logged out
    When I log in with my registered credentials
    Then I should be logged in as my user

  @regression @account
  Scenario: TC05 - Registering with an existing email is rejected
    Given I have registered a new account
    When I log out to reach a clean signup form
    And I attempt to sign up again with the same email
    Then I should see an "email already exists" error
    When I log in with my registered credentials
    Then I should be logged in as my user
