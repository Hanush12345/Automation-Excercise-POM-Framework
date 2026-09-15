import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { HeaderComponent, FooterComponent } from './components';
import { ROUTES } from '../src/data/routes';
import { CartRow } from '../src/types';
import { toAmount } from '../src/utils/priceHelper';

export class CartPage extends BasePage {
  readonly path = ROUTES.cart;
  readonly pageIdentifier: Locator;

  readonly header: HeaderComponent;
  readonly footer: FooterComponent;

  readonly cartTable: Locator;
  readonly rows: Locator;
  readonly emptyCartMessage: Locator;
  readonly proceedToCheckoutButton: Locator;

  // Guest-checkout modal (TC14)
  readonly checkoutModal: Locator;
  readonly registerLoginLink: Locator;
  readonly continueOnCartButton: Locator;

  constructor(page: Page) {
    super(page);
    this.header = new HeaderComponent(page);
    this.footer = new FooterComponent(page);

    this.cartTable = page.locator('#cart_info_table');
    this.pageIdentifier = page.locator('#cart_items');
    this.rows = this.cartTable.locator('tbody tr');
    this.emptyCartMessage = page.locator('#empty_cart');
    this.proceedToCheckoutButton = page.locator('.check_out').first();

    this.checkoutModal = page.locator('#checkoutModal');
    this.registerLoginLink = this.checkoutModal.locator('a[href="/login"]');
    this.continueOnCartButton = this.checkoutModal.locator('button.close-checkout-modal');
  }

  async assertCartPageVisible(): Promise<void> {
    await expect(this.pageIdentifier).toBeVisible();
    await this.expectUrlToContain('/view_cart');
  }

  async itemCount(): Promise<number> {
    return this.rows.count();
  }

  private rowFor(productName: string): Locator {
    return this.rows.filter({ hasText: productName }).first();
  }

  async assertProductInCart(productName: string): Promise<void> {
    await expect(this.rowFor(productName)).toBeVisible();
  }

  async assertProductNotInCart(productName: string): Promise<void> {
    await expect(this.rowFor(productName)).toHaveCount(0);
  }

  async getRow(productName: string): Promise<CartRow> {
    const row = this.rowFor(productName);
    await expect(row).toBeVisible();
    return {
      name: (await row.locator('.cart_description h4 a').innerText()).trim(),
      price: (await row.locator('.cart_price p').innerText()).trim(),
      quantity: Number((await row.locator('.cart_quantity button').innerText()).trim()),
      total: (await row.locator('.cart_total_price').innerText()).trim(),
    };
  }

  async getAllRows(): Promise<CartRow[]> {
    const count = await this.itemCount();
    const rows: CartRow[] = [];
    for (let i = 0; i < count; i++) {
      const row = this.rows.nth(i);
      rows.push({
        name: (await row.locator('.cart_description h4 a').innerText()).trim(),
        price: (await row.locator('.cart_price p').innerText()).trim(),
        quantity: Number((await row.locator('.cart_quantity button').innerText()).trim()),
        total: (await row.locator('.cart_total_price').innerText()).trim(),
      });
    }
    return rows;
  }

  /** TC12/TC13: price x quantity must equal the displayed line total. */
  async assertLineTotalIsCorrect(productName: string): Promise<void> {
    const row = await this.getRow(productName);
    expect(toAmount(row.total)).toBe(toAmount(row.price) * row.quantity);
  }

  async assertQuantity(productName: string, expectedQuantity: number): Promise<void> {
    const row = await this.getRow(productName);
    expect(row.quantity, `Quantity mismatch for "${productName}"`).toBe(expectedQuantity);
  }

  // --- TC17: Remove product ---
  async removeProduct(productName: string): Promise<void> {
    const row = this.rowFor(productName);
    await row.locator('.cart_quantity_delete').click();
    await expect(row).toHaveCount(0);
  }

  async assertCartIsEmpty(): Promise<void> {
    await expect(this.emptyCartMessage).toBeVisible();
  }

  // --- Checkout entry points ---
  async proceedToCheckout(): Promise<void> {
    await this.safeClick(this.proceedToCheckoutButton);
  }

  async assertGuestCheckoutModalVisible(): Promise<void> {
    // Same AJAX-triggered-modal latency as CartModal.waitUntilVisible in
    // components.ts — the default 5s expect timeout is unreliable here.
    await expect(this.checkoutModal).toBeVisible({ timeout: 15_000 });
  }

  async chooseRegisterLoginFromModal(): Promise<void> {
    await this.assertGuestCheckoutModalVisible();
    await this.registerLoginLink.click();
  }
}
