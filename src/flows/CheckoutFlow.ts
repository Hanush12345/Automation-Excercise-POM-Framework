import { Page, expect } from '@playwright/test';
import { CartPage } from '../../pages/CartPage';
import { CheckoutPage } from '../../pages/CheckoutPage';
import { PaymentPage } from '../../pages/PaymentPage';
import { buildCard } from '../utils/dataGenerator';
import { UserAccount } from '../types';

export class CheckoutFlow {
  private readonly cart: CartPage;
  private readonly checkout: CheckoutPage;
  private readonly payment: PaymentPage;

  constructor(page: Page) {
    this.cart = new CartPage(page);
    this.checkout = new CheckoutPage(page);
    this.payment = new PaymentPage(page);
  }

  /** Cart -> Checkout -> Payment -> Order Placed. Returns nothing; asserts the happy path. */
  async completeOrder(user: UserAccount, comment = 'Placed by automated regression suite.'): Promise<void> {
    await this.cart.assertCartPageVisible();
    await this.cart.proceedToCheckout();

    await this.checkout.assertCheckoutPageVisible();
    await this.checkout.assertDeliveryAddressMatches(user);
    await this.checkout.assertBillingAddressMatches(user);
    await this.checkout.assertOrderReviewNotEmpty();
    await this.checkout.addComment(comment);
    await this.checkout.placeOrder();

    await this.payment.pay(buildCard(`${user.firstName} ${user.lastName}`));
    await this.payment.assertOrderPlaced();
  }

  /** TC24 extension: complete the order, then download and sanity-check the invoice. */
  async completeOrderAndDownloadInvoice(user: UserAccount): Promise<string> {
    await this.completeOrder(user);
    const invoicePath = await this.payment.downloadInvoice();
    expect(invoicePath, 'Invoice download did not produce a file path').toBeTruthy();
    return invoicePath;
  }
}
