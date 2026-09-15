import { Download, Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { HeaderComponent } from './components';
import { ROUTES } from '../src/data/routes';
import { MESSAGES } from '../src/data/testData';
import { CardDetails } from '../src/types';
import { saveBuffer, saveDownload } from '../src/utils/fileHelper';

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
    // Scroll into view first, the way safeClick does elsewhere, so an ad banner
    // overlaying the button cannot swallow the click.
    await this.downloadInvoiceButton.scrollIntoViewIfNeeded();

    // WebKit on Linux never fires a 'download' event for this response, so the
    // normal path hangs until timeout there (chromium and firefox on the same
    // CI runner both pass, as does webkit on Windows - it is an engine/platform
    // limitation, not a defect in the site or this test). Fetch the invoice
    // over HTTP for that engine instead: it still asserts the link resolves and
    // returns a real file, just without the browser download machinery.
    const engine = this.page.context().browser()?.browserType().name();
    if (engine === 'webkit') {
      return this.fetchInvoiceOverHttp();
    }

    const downloadPromise: Promise<Download> = this.page.waitForEvent('download', { timeout: 60_000 });
    await this.downloadInvoiceButton.click({ timeout: 15_000 });
    const download = await downloadPromise;
    return saveDownload(download);
  }

  /** WebKit fallback for downloadInvoice - see the comment there. */
  private async fetchInvoiceOverHttp(): Promise<string> {
    const href = await this.downloadInvoiceButton.getAttribute('href');
    if (!href) throw new Error('Download Invoice link has no href attribute.');

    // The href is site-relative; resolve it against the current page URL so the
    // request carries the same origin (and the context's session cookies).
    const url = new URL(href, this.page.url()).toString();
    const response = await this.page.request.get(url, { timeout: 60_000 });
    if (!response.ok()) {
      throw new Error(`Invoice request failed: ${response.status()} ${response.statusText()} for ${url}`);
    }

    // Derive the name the way the browser's own download would: from
    // Content-Disposition, not from the URL. The invoice href ends with the
    // purchase amount (/download_invoice/500), so the path basename would be
    // "500" and fail the caller's assertion that the name looks like an
    // invoice - the one thing that differed from the real download path.
    const disposition = response.headers()['content-disposition'] ?? '';
    const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
    const fileName = match ? decodeURIComponent(match[1].trim()) : 'invoice.txt';

    return saveBuffer(await response.body(), fileName);
  }

  async clickContinue(): Promise<void> {
    await this.safeClick(this.continueButton);
  }
}
