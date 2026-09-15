import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { uniqueEmail } from '../src/utils/dataGenerator';
import { CustomWorld } from '../support/world';

// --- TC07: Test Cases page ---

When('I navigate to Test Cases via the header', async function (this: CustomWorld) {
  await this.homePage.header.goToTestCases();
});

Then('the Test Cases page should list at least one test case', async function (this: CustomWorld) {
  await this.testCasesPage.assertTestCasesPageVisible();
  expect(await this.testCasesPage.testCaseCount(), 'Test Cases page should list test cases').toBeGreaterThan(0);
});

// --- TC10 / TC11: newsletter subscription ---

When('I scroll to the bottom of the home page', async function (this: CustomWorld) {
  await this.homePage.scrollToBottom();
});

Then('the newsletter subscription widget should be visible on the home page', async function (this: CustomWorld) {
  await this.homePage.footer.assertSubscriptionVisible();
});

When('I subscribe with a random email on the home page', async function (this: CustomWorld) {
  await this.homePage.footer.subscribe(uniqueEmail('qa.subscribe'));
});

Then('the subscription should be confirmed on the home page', async function (this: CustomWorld) {
  await this.homePage.footer.assertSubscribedSuccessfully();
});

When('I scroll to the bottom of the cart page', async function (this: CustomWorld) {
  await this.cartPage.scrollToBottom();
});

Then('the newsletter subscription widget should be visible on the cart page', async function (this: CustomWorld) {
  await this.cartPage.footer.assertSubscriptionVisible();
});

When('I subscribe with a random email on the cart page', async function (this: CustomWorld) {
  await this.cartPage.footer.subscribe(uniqueEmail('qa.cartsub'));
});

Then('the subscription should be confirmed on the cart page', async function (this: CustomWorld) {
  await this.cartPage.footer.assertSubscribedSuccessfully();
});

// --- TC25 / TC26: scroll behaviour ---

Then('the vertical scroll position should be greater than zero', async function (this: CustomWorld) {
  expect(await this.homePage.verticalScrollPosition()).toBeGreaterThan(0);
});

Then('the newsletter subscription widget should be in view', async function (this: CustomWorld) {
  await this.homePage.assertFooterSubscriptionInView();
});

Then('the scroll-up arrow should be visible', async function (this: CustomWorld) {
  await this.homePage.assertScrollUpArrowVisible();
});

When('I click the scroll-up arrow', async function (this: CustomWorld) {
  await this.homePage.clickScrollUpArrow();
});

Then('the vertical scroll position should be zero', async function (this: CustomWorld) {
  expect(await this.homePage.verticalScrollPosition()).toBe(0);
});

Then('the hero heading should be back in view', async function (this: CustomWorld) {
  await this.homePage.assertHeroHeadingInView();
});

When('I scroll back to the top without using the arrow', async function (this: CustomWorld) {
  await this.homePage.scrollToTop();
});
