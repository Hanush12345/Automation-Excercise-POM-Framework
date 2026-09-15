import { test, expect } from '../../src/fixtures/pages.fixture';
import { CATEGORIES, SEARCH_TERMS } from '../../src/data/testData';
import { buildReview } from '../../src/utils/dataGenerator';

test.describe('Product catalogue', () => {
  test('TC08 @smoke @regression - All Products page and product detail page', async ({
    homePage,
    productsPage,
    productDetailPage,
  }) => {
    await test.step('Navigate to All Products', async () => {
      await homePage.open();
      await homePage.header.goToProducts();
      await productsPage.assertAllProductsHeadingVisible();
      await productsPage.assertProductListNotEmpty();
    });

    await test.step('Open the first product and verify all detail fields', async () => {
      await productsPage.viewProduct(0);
      await productDetailPage.assertLoaded();
      await productDetailPage.expectUrlToContain('/product_details/');
      await productDetailPage.assertAllDetailsVisible();

      const details = await productDetailPage.getProductDetails();
      expect(details.name.length).toBeGreaterThan(0);
      expect(details.price).toMatch(/Rs\.\s?\d+/);
      expect(details.availability).toMatch(/In Stock/i);
    });
  });

  test('TC09 @regression - Search returns only matching products', async ({ homePage, productsPage }) => {
    await homePage.open();
    await homePage.header.goToProducts();
    await productsPage.assertAllProductsHeadingVisible();

    await productsPage.searchFor(SEARCH_TERMS.valid);
    await productsPage.assertSearchedProductsHeadingVisible();
    await productsPage.assertAllResultsMatch(SEARCH_TERMS.valid);
  });

  test('TC18 @regression - View products by category', async ({ homePage, productsPage }) => {
    await homePage.open();
    await productsPage.sidebar.assertCategoriesVisible();

    await test.step('Women > Dress', async () => {
      await productsPage.sidebar.selectSubCategory(CATEGORIES.women.name, 'Dress');
      await productsPage.assertCategoryPageTitle('Women - Dress Products');
      await productsPage.assertProductListNotEmpty();
    });

    await test.step('Men > Tshirts', async () => {
      await productsPage.sidebar.selectSubCategory(CATEGORIES.men.name, 'Tshirts');
      await productsPage.assertCategoryPageTitle('Men - Tshirts Products');
      await productsPage.assertProductListNotEmpty();
    });
  });

  test('TC19 @regression - View and navigate brand products', async ({ homePage, productsPage }) => {
    await homePage.open();
    await homePage.header.goToProducts();
    await productsPage.sidebar.assertBrandsVisible();

    const brands = await productsPage.sidebar.brandNames();
    expect(brands.length, 'No brands rendered in the sidebar').toBeGreaterThan(1);

    await test.step(`Open brand: ${brands[0]}`, async () => {
      await productsPage.sidebar.selectBrand(brands[0]);
      await productsPage.expectUrlToContain('/brand_products/');
      await productsPage.assertProductListNotEmpty();
    });

    await test.step(`Switch to brand: ${brands[1]}`, async () => {
      await productsPage.sidebar.selectBrand(brands[1]);
      await productsPage.expectUrlToContain('/brand_products/');
      await productsPage.assertProductListNotEmpty();
    });
  });
});

test.describe('Product reviews', () => {
  test('TC21 @regression - Add a review on a product', async ({ homePage, productsPage, productDetailPage }) => {
    await homePage.open();
    await homePage.header.goToProducts();
    await productsPage.assertAllProductsHeadingVisible();

    await productsPage.viewProduct(0);
    await productDetailPage.assertLoaded();
    await productDetailPage.assertWriteReviewVisible();

    await productDetailPage.submitReview(buildReview());
    await productDetailPage.assertReviewSubmitted();
  });
});
