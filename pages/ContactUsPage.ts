import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { HeaderComponent } from './components';
import { ROUTES } from '../src/data/routes';
import { MESSAGES } from '../src/data/testData';
import { ContactMessage } from '../src/types';

export class ContactUsPage extends BasePage {
  readonly path = ROUTES.contactUs;
  readonly pageIdentifier: Locator;
  readonly header: HeaderComponent;

  readonly getInTouchHeading: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly subjectInput: Locator;
  readonly messageTextarea: Locator;
  readonly uploadFileInput: Locator;
  readonly submitButton: Locator;
  readonly successAlert: Locator;
  readonly homeButton: Locator;

  constructor(page: Page) {
    super(page);
    this.header = new HeaderComponent(page);

    this.getInTouchHeading = page.locator('.contact-form h2.title');
    this.pageIdentifier = this.getInTouchHeading;
    this.nameInput = page.locator('input[data-qa="name"]');
    this.emailInput = page.locator('input[data-qa="email"]');
    this.subjectInput = page.locator('input[data-qa="subject"]');
    this.messageTextarea = page.locator('#message');
    this.uploadFileInput = page.locator('input[name="upload_file"]');
    this.submitButton = page.locator('input[data-qa="submit-button"]');
    this.successAlert = page.locator('.status.alert-success');
    this.homeButton = page.locator('#form-section a.btn-success');
  }

  async assertGetInTouchVisible(): Promise<void> {
    await expect(this.getInTouchHeading).toContainText(/Get In Touch/i);
  }

  async fillForm(message: ContactMessage): Promise<void> {
    await this.fill(this.nameInput, message.name);
    await this.fill(this.emailInput, message.email);
    await this.fill(this.subjectInput, message.subject);
    await this.fill(this.messageTextarea, message.message);
    if (message.attachmentPath) {
      await this.uploadFileInput.setInputFiles(message.attachmentPath);
    }
  }

  /**
   * The form fires a native window.confirm on submit.
   * The handler must be registered BEFORE the click or the dialog auto-dismisses.
   */
  async submitAndAcceptDialog(): Promise<void> {
    this.page.once('dialog', (dialog) => void dialog.accept());
    await this.safeClick(this.submitButton);
  }

  async assertSubmittedSuccessfully(): Promise<void> {
    // The alert is populated after the multipart form submission round-trips; the
    // default 5s expect timeout is consistently too short for that, unlike the
    // simpler AJAX responses elsewhere on this site.
    await expect(this.successAlert).toBeVisible({ timeout: 15_000 });
    await expect(this.successAlert).toContainText(MESSAGES.contactSuccess);
  }

  async clickHome(): Promise<void> {
    await this.safeClick(this.homeButton);
  }
}
