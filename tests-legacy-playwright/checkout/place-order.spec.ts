import { test } from '../../src/fixtures/pages.fixture';

test.describe('Place order', () => {
  test('TC14 @smoke @regression - Register while checkout', async ({
    homePage,
    productsPage,
    cartPage,
    checkoutFlow,
    registrationFlow,
  }) => {
    await test.step('Add a product to the cart as a guest', async () => {
      await homePage.open();
      await homePage.header.goToProducts();
      await productsPage.addAllVisibleProductsToCart(1);
      await productsPage.header.goToCart();
      await cartPage.assertCartPageVisible();
    });

    await test.step('Proceed to checkout and choose Register / Login', async () => {
      await cartPage.proceedToCheckout();
      await cartPage.chooseRegisterLoginFromModal();
    });

    const user = await test.step('Register from inside the checkout funnel', async () =>
      registrationFlow.registerFromCheckout());

    await test.step('Return to the cart and complete the order', async () => {
      await homePage.header.goToCart();
      await checkoutFlow.completeOrder(user);
    });

    await test.step('Cleanup', async () => {
      await homePage.open();
      await registrationFlow.deleteCurrentAccount();
    });
  });

  test('TC15 @regression - Register before checkout', async ({
    homePage,
    productsPage,
    checkoutFlow,
    registrationFlow,
  }) => {
    const user = await test.step('Register first', async () => registrationFlow.registerNewUser());

    await test.step('Add a product and place the order', async () => {
      await homePage.header.goToProducts();
      await productsPage.addAllVisibleProductsToCart(1);
      await productsPage.header.goToCart();
      await checkoutFlow.completeOrder(user);
    });

    await test.step('Cleanup', async () => {
      await homePage.open();
      await registrationFlow.deleteCurrentAccount();
    });
  });

  test('TC16 @regression - Login before checkout', async ({
    homePage,
    loginPage,
    productsPage,
    checkoutFlow,
    registrationFlow,
  }) => {
    const user = await test.step('Pre-condition: register, then log out', async () => {
      const created = await registrationFlow.registerNewUser();
      await homePage.header.logout();
      return created;
    });

    await test.step('Log in', async () => {
      await loginPage.login({ email: user.email, password: user.password });
      await homePage.header.assertLoggedInAs(user.name);
    });

    await test.step('Add a product and place the order', async () => {
      await homePage.header.goToProducts();
      await productsPage.addAllVisibleProductsToCart(1);
      await productsPage.header.goToCart();
      await checkoutFlow.completeOrder(user);
    });

    await test.step('Cleanup', async () => {
      await homePage.open();
      await registrationFlow.deleteCurrentAccount();
    });
  });
});
