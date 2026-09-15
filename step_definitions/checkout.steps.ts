import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { fileExistsAndNotEmpty } from '../src/utils/fileHelper';
import { CustomWorld } from '../support/world';

When('I proceed to checkout', async function (this: CustomWorld) {
  await this.cartPage.proceedToCheckout();
});

Then('the checkout page should be displayed', async function (this: CustomWorld) {
  await this.checkoutPage.assertCheckoutPageVisible();
});

Then('the delivery address should match my registration details', async function (this: CustomWorld) {
  const user = this.scenarioState.user;
  if (!user) throw new Error('No registered user in scenario state.');
  await expect(this.checkoutPage.deliveryAddressHeading).toContainText(/Your delivery address/i);
  await this.checkoutPage.assertDeliveryAddressMatches(user);
});

Then('the billing address should match my registration details', async function (this: CustomWorld) {
  const user = this.scenarioState.user;
  if (!user) throw new Error('No registered user in scenario state.');
  await expect(this.checkoutPage.billingAddressHeading).toContainText(/Your billing address/i);
  await this.checkoutPage.assertBillingAddressMatches(user);
});

// --- Place order (bundles checkout + payment; the underlying CheckoutFlow already
// asserts the order confirmation, so there is no separate "order placed" step) ---

When('I place the order and pay', async function (this: CustomWorld) {
  const user = this.scenarioState.user;
  if (!user) throw new Error('No registered user in scenario state.');
  await this.checkoutFlow.completeOrder(user);
});

When('I place the order, pay, and download the invoice', async function (this: CustomWorld) {
  const user = this.scenarioState.user;
  if (!user) throw new Error('No registered user in scenario state.');
  this.scenarioState.invoicePath = await this.checkoutFlow.completeOrderAndDownloadInvoice(user);
});

Then('the invoice should download as a valid file', async function (this: CustomWorld) {
  const invoicePath = this.scenarioState.invoicePath;
  if (!invoicePath) throw new Error('No invoice downloaded in scenario state.');
  expect(invoicePath).toMatch(/invoice/i);
  expect(fileExistsAndNotEmpty(invoicePath), `Invoice file is missing or empty: ${invoicePath}`).toBe(true);
});

// --- TC14: registering mid-checkout ---

When('I proceed to checkout as a guest', async function (this: CustomWorld) {
  await this.cartPage.proceedToCheckout();
  await this.cartPage.chooseRegisterLoginFromModal();
});

When('I register a new account from inside the checkout flow', async function (this: CustomWorld) {
  this.scenarioState.user = await this.registrationFlow.registerFromCheckout();
});
