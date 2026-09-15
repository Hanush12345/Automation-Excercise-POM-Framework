import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { buildReview } from '../src/utils/dataGenerator';
import { CustomWorld } from '../support/world';

Then('I should see the {string} heading', async function (this: CustomWorld, heading: string) {
  if (heading !== 'All Products') throw new Error(`Unknown heading: "${heading}"`);
  await this.productsPage.assertAllProductsHeadingVisible();
});

Then('the product list should not be empty', async function (this: CustomWorld) {
  await this.productsPage.assertProductListNotEmpty();
});

// --- TC08: product detail navigation ---

When('I open the first product from the list', async function (this: CustomWorld) {
  await this.productsPage.viewProduct(0);
  await this.productDetailPage.assertLoaded();
});

Then('the product detail URL should contain {string}', async function (this: CustomWorld, fragment: string) {
  await this.productDetailPage.expectUrlToContain(fragment);
});

Then('all product detail fields should be visible and populated', async function (this: CustomWorld) {
  await this.productDetailPage.assertAllDetailsVisible();
  const details = await this.productDetailPage.getProductDetails();
  expect(details.name.length).toBeGreaterThan(0);
  expect(details.price).toMatch(/Rs\.\s?\d+/);
  expect(details.availability).toMatch(/In Stock/i);
});

// --- TC09: search ---

When('I search for {string}', async function (this: CustomWorld, term: string) {
  await this.productsPage.searchFor(term);
});

Then('the {string} heading should be visible', async function (this: CustomWorld, heading: string) {
  if (heading !== 'Searched Products') throw new Error(`Unknown heading: "${heading}"`);
  await this.productsPage.assertSearchedProductsHeadingVisible();
});

Then('the results should include products matching {string}', async function (this: CustomWorld, term: string) {
  await this.productsPage.assertAllResultsMatch(term);
});

// --- TC18: category navigation ---

Then('the category sidebar should be visible', async function (this: CustomWorld) {
  await this.productsPage.sidebar.assertCategoriesVisible();
});

When('I select the {string} > {string} subcategory', async function (this: CustomWorld, category: string, subCategory: string) {
  await this.productsPage.sidebar.selectSubCategory(category as 'Women' | 'Men' | 'Kids', subCategory);
});

Then('the category page title should contain {string}', async function (this: CustomWorld, title: string) {
  await this.productsPage.assertCategoryPageTitle(title);
});

// --- TC19: brand navigation ---

Then('the brands panel should be visible', async function (this: CustomWorld) {
  await this.productsPage.sidebar.assertBrandsVisible();
});

When('I select the first brand from the sidebar', async function (this: CustomWorld) {
  const brands = await this.productsPage.sidebar.brandNames();
  expect(brands.length, 'No brands rendered in the sidebar').toBeGreaterThan(1);
  this.scenarioState.brands = brands;
  await this.productsPage.sidebar.selectBrand(brands[0]);
});

Then('the brand product URL should contain {string}', async function (this: CustomWorld, fragment: string) {
  await this.productsPage.expectUrlToContain(fragment);
});

When('I switch to the second brand from the sidebar', async function (this: CustomWorld) {
  const brands = this.scenarioState.brands;
  if (!brands) throw new Error('No brands in scenario state — select the first brand first.');
  await this.productsPage.sidebar.selectBrand(brands[1]);
});

// --- TC21: product review ---

Then('the {string} tab should be visible', async function (this: CustomWorld, tab: string) {
  if (tab !== 'Write a Review') throw new Error(`Unknown tab: "${tab}"`);
  await this.productDetailPage.assertWriteReviewVisible();
});

When('I submit a random product review', async function (this: CustomWorld) {
  await this.productDetailPage.submitReview(buildReview());
});

Then('the review submission should be confirmed', async function (this: CustomWorld) {
  await this.productDetailPage.assertReviewSubmitted();
});
