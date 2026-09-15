import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PRODUCT_IDS } from '../src/data/testData';
import { toAmount } from '../src/utils/priceHelper';
import { CustomWorld } from '../support/world';

// --- Adding / viewing cart contents ---

When('I add the first {int} products to the cart', async function (this: CustomWorld, count: number) {
  this.scenarioState.addedProducts = await this.productsPage.addAllVisibleProductsToCart(count);
});

Then('the cart should be displayed', async function (this: CustomWorld) {
  await this.cartPage.assertCartPageVisible();
});

Then('the cart should contain {int} items', async function (this: CustomWorld, count: number) {
  expect(await this.cartPage.itemCount()).toBe(count);
});

Then('each added product should be in the cart with the correct price and quantity', async function (this: CustomWorld) {
  const addedProducts = this.scenarioState.addedProducts ?? [];
  for (const name of addedProducts) {
    await this.cartPage.assertProductInCart(name);
    await this.cartPage.assertQuantity(name, 1);
    await this.cartPage.assertLineTotalIsCorrect(name);
  }
});

// --- TC13: quantity set on the product detail page ---

Given('I open the product detail page for the Blue Top product', async function (this: CustomWorld) {
  await this.productDetailPage.openById(PRODUCT_IDS.blueTop);
  await this.productDetailPage.assertLoaded();
  this.scenarioState.productDetails = await this.productDetailPage.getProductDetails();
});

When('I set the quantity to {int} and add it to the cart', async function (this: CustomWorld, quantity: number) {
  await this.productDetailPage.setQuantity(quantity);
  await this.productDetailPage.addToCart();
  await this.productDetailPage.cartModal.viewCart();
});

Then('the cart should show a quantity of {int} for that product', async function (this: CustomWorld, quantity: number) {
  const details = this.scenarioState.productDetails;
  if (!details) throw new Error('No product details in scenario state.');
  await this.cartPage.assertQuantity(details.name, quantity);
});

Then('the line total should equal the price times the quantity', async function (this: CustomWorld) {
  const details = this.scenarioState.productDetails;
  if (!details) throw new Error('No product details in scenario state.');
  const row = await this.cartPage.getRow(details.name);
  expect(toAmount(row.total)).toBe(toAmount(row.price) * row.quantity);
});

Then('the first added product should be in the cart', async function (this: CustomWorld) {
  const [firstProduct] = this.scenarioState.addedProducts ?? [];
  if (!firstProduct) throw new Error('No added products in scenario state.');
  await this.cartPage.assertProductInCart(firstProduct);
});

// --- TC17: removing a product ---

When('I remove the first added product from the cart', async function (this: CustomWorld) {
  const [firstProduct] = this.scenarioState.addedProducts ?? [];
  if (!firstProduct) throw new Error('No added products in scenario state.');
  await this.cartPage.removeProduct(firstProduct);
});

Then('that product should no longer appear in the cart', async function (this: CustomWorld) {
  const [firstProduct] = this.scenarioState.addedProducts ?? [];
  if (!firstProduct) throw new Error('No added products in scenario state.');
  await this.cartPage.assertProductNotInCart(firstProduct);
});

Then('the cart should be empty', async function (this: CustomWorld) {
  await this.cartPage.assertCartIsEmpty();
});

// --- TC22: recommended items ---

When('I add a recommended product from the home page to the cart', async function (this: CustomWorld) {
  await this.homePage.scrollToBottom();
  await this.homePage.assertRecommendedItemsVisible();
  const productName = await this.homePage.addRecommendedProductToCart();
  this.scenarioState.addedProducts = [productName];
  await this.homePage.cartModal.viewCart();
});

Then('the recommended product should appear in the cart', async function (this: CustomWorld) {
  const [productName] = this.scenarioState.addedProducts ?? [];
  if (!productName) throw new Error('No recommended product in scenario state.');
  await this.cartPage.assertProductInCart(productName);
});

// --- TC20: cart persistence across login ---

When('I search for {string} and add up to {int} results to the cart', async function (this: CustomWorld, term: string, max: number) {
  await this.productsPage.searchFor(term);
  await this.productsPage.assertSearchedProductsHeadingVisible();
  await this.productsPage.assertAllResultsMatch(term);
  const count = Math.min(await this.productsPage.productCount(), max);
  this.scenarioState.searchResults = await this.productsPage.addAllVisibleProductsToCart(count);
});

Then('all the searched products should be in the cart', async function (this: CustomWorld) {
  const searchResults = this.scenarioState.searchResults ?? [];
  for (const name of searchResults) {
    await this.cartPage.assertProductInCart(name);
  }
});

Then('the cart should still contain all the searched products', async function (this: CustomWorld) {
  const searchResults = this.scenarioState.searchResults ?? [];
  expect(await this.cartPage.itemCount()).toBe(searchResults.length);
  for (const name of searchResults) {
    await this.cartPage.assertProductInCart(name);
  }
});
