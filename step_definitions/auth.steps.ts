import { When, Then } from '@cucumber/cucumber';
import { buildUser } from '../src/utils/dataGenerator';
import { CustomWorld } from '../support/world';

When(/^I navigate to Signup \/ Login$/, async function (this: CustomWorld) {
  await this.homePage.header.goToSignupLogin();
});

Then('the signup form should be visible', async function (this: CustomWorld) {
  await this.loginPage.assertSignupFormVisible();
});

Then('the login form should be visible', async function (this: CustomWorld) {
  await this.loginPage.assertLoginFormVisible();
});

When('I log out to reach a clean signup form', async function (this: CustomWorld) {
  await this.homePage.header.logout();
  await this.loginPage.assertSignupFormVisible();
});

When('I start signup with a new random name and email', async function (this: CustomWorld) {
  const user = buildUser();
  this.scenarioState.user = user;
  await this.loginPage.startSignup(user.name, user.email);
});

Then('the account information form should be pre-filled with my name and email', async function (this: CustomWorld) {
  const user = this.scenarioState.user;
  if (!user) throw new Error('No user in scenario state — start signup first.');
  await this.signupPage.assertEnterAccountInformationVisible();
  await this.signupPage.assertPrefilled(user.name, user.email);
});

When('I complete the account and address information', async function (this: CustomWorld) {
  const user = this.scenarioState.user;
  if (!user) throw new Error('No user in scenario state — start signup first.');
  await this.signupPage.completeRegistration(user);
});

Then('my account should be created', async function (this: CustomWorld) {
  await this.accountStatusPage.assertAccountCreated();
  await this.accountStatusPage.clickContinue();
});

When('I attempt to sign up again with the same email', async function (this: CustomWorld) {
  const user = this.scenarioState.user;
  if (!user) throw new Error('No registered user in scenario state.');
  await this.loginPage.startSignup(user.name, user.email);
});

Then('I should see an {string} error', async function (this: CustomWorld, kind: string) {
  if (kind === 'email already exists') {
    await this.loginPage.assertEmailAlreadyExistsError();
  } else if (kind === 'incorrect credentials') {
    await this.loginPage.assertInvalidCredentialsError();
  } else {
    throw new Error(`Unknown error kind: "${kind}"`);
  }
});

When('I log in with invalid credentials', async function (this: CustomWorld) {
  await this.loginPage.login({ email: 'not.a.real.user.9f2c@example.com', password: 'WrongPassw0rd!' });
});

Then('the header should show my name as logged in', async function (this: CustomWorld) {
  const user = this.scenarioState.user;
  if (!user) throw new Error('No registered user in scenario state.');
  const displayedName = await this.homePage.header.loggedInUserName();
  if (displayedName !== user.name) {
    throw new Error(`Expected header to show "${user.name}" but found "${displayedName}"`);
  }
});
