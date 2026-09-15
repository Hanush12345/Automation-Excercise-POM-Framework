import { test, expect } from '../../src/fixtures/pages.fixture';
import { fileExistsAndNotEmpty } from '../../src/utils/fileHelper';

test.describe('Checkout details and invoice', () => {
  test('TC23 @regression - Delivery and billing addresses match the registration data', async ({
    homePage,
    productsPage,
    cartPage,
    checkoutPage,
    registrationFlow,
  }) => {
    const user = await test.step('Register a new user', async () => registrationFlow.registerNewUser());

    await test.step('Add a product and proceed to checkout', async () => {
      await homePage.header.goToProducts();
      await productsPage.addAllVisibleProductsToCart(1);
      await productsPage.header.goToCart();
      await cartPage.assertCartPageVisible();
      await cartPage.proceedToCheckout();
      await checkoutPage.assertCheckoutPageVisible();
    });

    await test.step('Verify the delivery address block', async () => {
      await expect(checkoutPage.deliveryAddressHeading).toContainText(/Your delivery address/i);
      await checkoutPage.assertDeliveryAddressMatches(user);
    });

    await test.step('Verify the billing address block', async () => {
      await expect(checkoutPage.billingAddressHeading).toContainText(/Your billing address/i);
      await checkoutPage.assertBillingAddressMatches(user);
    });

    await test.step('Cleanup', async () => {
      await homePage.open();
      await registrationFlow.deleteCurrentAccount();
    });
  });

  test('TC24 @regression - Download the invoice after placing an order', async ({
    homePage,
    productsPage,
    checkoutFlow,
    registrationFlow,
  }) => {
    const user = await registrationFlow.registerNewUser();

    await homePage.header.goToProducts();
    await productsPage.addAllVisibleProductsToCart(1);
    await productsPage.header.goToCart();

    const invoicePath = await test.step('Place the order and download the invoice', async () =>
      checkoutFlow.completeOrderAndDownloadInvoice(user));

    await test.step('Verify the downloaded invoice file', async () => {
      expect(invoicePath).toMatch(/invoice/i);
      expect(fileExistsAndNotEmpty(invoicePath), `Invoice file is missing or empty: ${invoicePath}`).toBe(true);
    });

    await test.step('Cleanup', async () => {
      await homePage.open();
      await registrationFlow.deleteCurrentAccount();
    });
  });
});
