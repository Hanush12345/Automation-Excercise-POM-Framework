import { test, expect } from '../../src/fixtures/pages.fixture';
import { PRODUCT_IDS, QUANTITY } from '../../src/data/testData';
import { toAmount } from '../../src/utils/priceHelper';

test.describe('Shopping cart', () => {
  test('TC12 @smoke @regression - Add multiple products to the cart', async ({
    homePage,
    productsPage,
    cartPage,
  }) => {
    await homePage.open();
    await homePage.header.goToProducts();
    await productsPage.assertAllProductsHeadingVisible();

    const addedProducts = await test.step('Add the first two products', async () =>
      productsPage.addAllVisibleProductsToCart(2));

    await test.step('Verify both products, prices and line totals in the cart', async () => {
      await productsPage.header.goToCart();
      await cartPage.assertCartPageVisible();
      expect(await cartPage.itemCount()).toBe(2);

      for (const name of addedProducts) {
        await cartPage.assertProductInCart(name);
        await cartPage.assertQuantity(name, 1);
        await cartPage.assertLineTotalIsCorrect(name);
      }
    });
  });

  test('TC13 @regression - Product quantity set on the detail page persists in the cart', async ({
    productDetailPage,
    cartPage,
  }) => {
    await productDetailPage.openById(PRODUCT_IDS.blueTop);
    await productDetailPage.assertLoaded();

    const details = await productDetailPage.getProductDetails();

    await productDetailPage.setQuantity(QUANTITY.multiple);
    await productDetailPage.addToCart();
    await productDetailPage.cartModal.viewCart();

    await cartPage.assertCartPageVisible();
    await cartPage.assertQuantity(details.name, QUANTITY.multiple);

    const row = await cartPage.getRow(details.name);
    expect(toAmount(row.total)).toBe(toAmount(row.price) * QUANTITY.multiple);
  });

  test('TC17 @regression - Remove a product from the cart', async ({ homePage, productsPage, cartPage }) => {
    await homePage.open();
    await homePage.header.goToProducts();
    const [firstProduct] = await productsPage.addAllVisibleProductsToCart(1);

    await productsPage.header.goToCart();
    await cartPage.assertCartPageVisible();
    await cartPage.assertProductInCart(firstProduct);

    await cartPage.removeProduct(firstProduct);
    await cartPage.assertProductNotInCart(firstProduct);
    await cartPage.assertCartIsEmpty();
  });

  test('TC22 @regression - Add to cart from Recommended Items', async ({ homePage, cartPage }) => {
    await homePage.open();
    await homePage.scrollToBottom();
    await homePage.assertRecommendedItemsVisible();

    const productName = await homePage.addRecommendedProductToCart();
    await homePage.cartModal.viewCart();

    await cartPage.assertCartPageVisible();
    await cartPage.assertProductInCart(productName);
  });
});
