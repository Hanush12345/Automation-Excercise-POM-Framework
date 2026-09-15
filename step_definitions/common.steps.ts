import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

// --- Navigation ---

Given('I open the home page', async function (this: CustomWorld) {
  await this.homePage.open();
});

Then('the home page should be displayed', async function (this: CustomWorld) {
  await this.homePage.assertHomePageVisible();
});

When('I navigate to Products via the header', async function (this: CustomWorld) {
  await this.homePage.header.goToProducts();
});

When('I open the cart', async function (this: CustomWorld) {
  await this.homePage.header.goToCart();
});

Then('the current URL should contain {string}', async function (this: CustomWorld, fragment: string) {
  const escaped = fragment.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
  await expect(this.page).toHaveURL(new RegExp(escaped));
});

// --- Account lifecycle (registration, login, logout, deletion) ---
// @account scenario cleanup lives in support/hooks.ts, mirroring
// the After({ tags: '@account' }) hook in features/step-definitions/common.steps.ts.

Given('I have registered a new account', async function (this: CustomWorld) {
  this.scenarioState.user = await this.registrationFlow.registerNewUser();
});

When('I log out', async function (this: CustomWorld) {
  await this.homePage.header.logout();
});

Then('I should be logged out', async function (this: CustomWorld) {
  await this.homePage.header.assertLoggedOut();
});

When('I log in with my registered credentials', async function (this: CustomWorld) {
  const user = this.scenarioState.user;
  if (!user) throw new Error('No registered user in scenario state — register an account first.');
  await this.loginPage.login({ email: user.email, password: user.password });
});

Then('I should be logged in as my user', async function (this: CustomWorld) {
  const user = this.scenarioState.user;
  if (!user) throw new Error('No registered user in scenario state — register an account first.');
  await this.homePage.header.assertLoggedInAs(user.name);
});

When('I delete my account', async function (this: CustomWorld) {
  await this.homePage.header.deleteAccount();
});

Then('the account deletion should be confirmed', async function (this: CustomWorld) {
  await this.accountStatusPage.assertAccountDeleted();
  await this.accountStatusPage.clickContinue();
  this.scenarioState.accountDeleted = true;
});
