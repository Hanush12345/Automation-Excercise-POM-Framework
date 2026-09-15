import { test, expect } from '../../src/fixtures/pages.fixture';
import { SEARCH_TERMS } from '../../src/data/testData';

test.describe('Cart persistence', () => {
  test('TC20 @regression - Cart contents survive logout and login', async ({
    homePage,
    productsPage,
    cartPage,
    loginPage,
    registrationFlow,
  }) => {
    const user = await test.step('Pre-condition: create an account and log out', async () => {
      const created = await registrationFlow.registerNewUser();
      await homePage.header.logout();
      return created;
    });

    const searchResults = await test.step('Search products and add all results to the cart', async () => {
      await homePage.header.goToProducts();
      await productsPage.searchFor(SEARCH_TERMS.valid);
      await productsPage.assertSearchedProductsHeadingVisible();
      await productsPage.assertAllResultsMatch(SEARCH_TERMS.valid);

      const count = Math.min(await productsPage.productCount(), 3);
      return productsPage.addAllVisibleProductsToCart(count);
    });

    await test.step('Verify the products are in the cart before logging in', async () => {
      await productsPage.header.goToCart();
      await cartPage.assertCartPageVisible();
      for (const name of searchResults) {
        await cartPage.assertProductInCart(name);
      }
    });

    await test.step('Log in and verify the cart is unchanged', async () => {
      await cartPage.header.goToSignupLogin();
      await loginPage.login({ email: user.email, password: user.password });
      await homePage.header.assertLoggedInAs(user.name);

      await homePage.header.goToCart();
      await cartPage.assertCartPageVisible();
      expect(await cartPage.itemCount()).toBe(searchResults.length);
      for (const name of searchResults) {
        await cartPage.assertProductInCart(name);
      }
    });

    await test.step('Cleanup', async () => registrationFlow.deleteCurrentAccount());
  });
});
