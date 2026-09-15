import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { HeaderComponent } from './components';
import { ROUTES } from '../src/data/routes';
import { UserAccount } from '../src/types';

export class CheckoutPage extends BasePage {
  readonly path = ROUTES.checkout;
  readonly pageIdentifier: Locator;
  readonly header: HeaderComponent;

  readonly deliveryAddressBlock: Locator;
  readonly billingAddressBlock: Locator;
  readonly deliveryAddressHeading: Locator;
  readonly billingAddressHeading: Locator;
  readonly orderReviewTable: Locator;
  readonly orderRows: Locator;
  readonly totalAmount: Locator;
  readonly commentTextarea: Locator;
  readonly placeOrderButton: Locator;

  constructor(page: Page) {
    super(page);
    this.header = new HeaderComponent(page);

    this.deliveryAddressBlock = page.locator('#address_delivery');
    this.billingAddressBlock = page.locator('#address_invoice');
    this.pageIdentifier = this.deliveryAddressBlock;
    this.deliveryAddressHeading = this.deliveryAddressBlock.locator('.address_title h3');
    this.billingAddressHeading = this.billingAddressBlock.locator('.address_title h3');
    this.orderReviewTable = page.locator('#cart_info');
    this.orderRows = this.orderReviewTable.locator('tbody tr');
    this.totalAmount = page.locator('.cart_total_price').last();
    this.commentTextarea = page.locator('textarea[name="message"]');
    this.placeOrderButton = page.getByRole('link', { name: 'Place Order' });
  }

  async assertCheckoutPageVisible(): Promise<void> {
    await expect(this.deliveryAddressBlock).toBeVisible();
    await expect(this.billingAddressBlock).toBeVisible();
  }

  private normalise(text: string): string[] {
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }

  async deliveryAddressLines(): Promise<string[]> {
    return this.normalise(await this.deliveryAddressBlock.innerText());
  }

  async billingAddressLines(): Promise<string[]> {
    return this.normalise(await this.billingAddressBlock.innerText());
  }

  /**
   * TC23: every address field entered at registration must appear in the block.
   * Asserts on field membership rather than exact line order — the site renders
   * "City State Zipcode" on one combined line.
   */
  private assertAddressContains(lines: string[], user: UserAccount, label: string): void {
    const flat = lines.join(' | ');
    const expectedFragments = [
      `${user.gender}. ${user.firstName} ${user.lastName}`,
      user.company,
      user.address1,
      user.address2,
      user.state,
      user.city,
      user.zipcode,
      user.country,
      user.mobileNumber,
    ];
    for (const fragment of expectedFragments) {
      expect(flat, `${label} address is missing "${fragment}"`).toContain(fragment);
    }
  }

  async assertDeliveryAddressMatches(user: UserAccount): Promise<void> {
    this.assertAddressContains(await this.deliveryAddressLines(), user, 'Delivery');
  }

  async assertBillingAddressMatches(user: UserAccount): Promise<void> {
    this.assertAddressContains(await this.billingAddressLines(), user, 'Billing');
  }

  async assertOrderReviewNotEmpty(): Promise<void> {
    await expect(this.orderRows.first()).toBeVisible();
    expect(await this.orderRows.count()).toBeGreaterThan(0);
  }

  async addComment(comment: string): Promise<void> {
    await this.fill(this.commentTextarea, comment);
  }

  async placeOrder(): Promise<void> {
    await this.safeClick(this.placeOrderButton);
  }
}
