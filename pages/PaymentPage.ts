import { Download, Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { HeaderComponent } from './components';
import { ROUTES } from '../src/data/routes';
import { MESSAGES } from '../src/data/testData';
import { CardDetails } from '../src/types';
import { saveDownload } from '../src/utils/fileHelper';

export class PaymentPage extends BasePage {
  readonly path = ROUTES.payment;
  readonly pageIdentifier: Locator;
  readonly header: HeaderComponent;

  readonly nameOnCardInput: Locator;
  readonly cardNumberInput: Locator;
  readonly cvcInput: Locator;
  readonly expiryMonthInput: Locator;
  readonly expiryYearInput: Locator;
  readonly payAndConfirmButton: Locator;

  readonly orderPlacedHeading: Locator;
  readonly confirmationMessage: Locator;
  readonly downloadInvoiceButton: Locator;
  readonly continueButton: Locator;

  constructor(page: Page) {
    super(page);
    this.header = new HeaderComponent(page);

    this.nameOnCardInput = page.locator('input[data-qa="name-on-card"]');
    this.pageIdentifier = this.nameOnCardInput;
    this.cardNumberInput = page.locator('input[data-qa="card-number"]');
    this.cvcInput = page.locator('input[data-qa="cvc"]');
    this.expiryMonthInput = page.locator('input[data-qa="expiry-month"]');
    this.expiryYearInput = page.locator('input[data-qa="expiry-year"]');
    this.payAndConfirmButton = page.locator('button[data-qa="pay-button"]');

    this.orderPlacedHeading = page.locator('h2[data-qa="order-placed"] b');
    this.confirmationMessage = page.locator('p', { hasText: MESSAGES.orderConfirmation });
    this.downloadInvoiceButton = page.getByRole('link', { name: 'Download Invoice' });
    this.continueButton = page.locator('a[data-qa="continue-button"]');
  }

  async assertPaymentPageVisible(): Promise<void> {
    await expect(this.nameOnCardInput).toBeVisible();
  }

  async fillCardDetails(card: CardDetails): Promise<void> {
    await this.fill(this.nameOnCardInput, card.nameOnCard);
    await this.fill(this.cardNumberInput, card.cardNumber);
    await this.fill(this.cvcInput, card.cvc);
    await this.fill(this.expiryMonthInput, card.expiryMonth);
    await this.fill(this.expiryYearInput, card.expiryYear);
  }

  async payAndConfirm(): Promise<void> {
    await this.safeClick(this.payAndConfirmButton);
  }

  async pay(card: CardDetails): Promise<void> {
    await this.assertPaymentPageVisible();
    await this.fillCardDetails(card);
    await this.payAndConfirm();
  }

  /** TC14-16: the site shows either the toast or the /payment_done screen depending on flow. */
  async assertOrderPlaced(): Promise<void> {
    await expect(this.orderPlacedHeading.or(this.confirmationMessage).first()).toBeVisible();
  }

  // --- TC24: Invoice download ---
  async downloadInvoice(): Promise<string> {
    await expect(this.downloadInvoiceButton).toBeVisible();
    // Scroll into view before clicking, the way safeClick does elsewhere: an ad
    // banner overlaying the button swallows the click, and the failure then
    // surfaces confusingly as a download-event timeout rather than a click
    // error. WebKit is given longer than the 30s default because it was the
    // only engine to time out here in CI while Chromium and Firefox passed.
    await this.downloadInvoiceButton.scrollIntoViewIfNeeded();
    const downloadPromise: Promise<Download> = this.page.waitForEvent('download', { timeout: 60_000 });
    await this.downloadInvoiceButton.click({ timeout: 15_000 });
    const download = await downloadPromise;
    return saveDownload(download);
  }

  async clickContinue(): Promise<void> {
    await this.safeClick(this.continueButton);
  }
}
