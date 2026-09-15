import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { HeaderComponent } from './components';
import { ROUTES } from '../src/data/routes';
import { MESSAGES } from '../src/data/testData';

/** Covers both /account_created and /delete_account confirmation screens. */
export class AccountStatusPage extends BasePage {
  readonly path = ROUTES.accountCreated;
  readonly pageIdentifier: Locator;

  readonly accountCreatedHeading: Locator;
  readonly accountDeletedHeading: Locator;
  readonly continueButton: Locator;

  constructor(page: Page) {
    super(page);
    this.accountCreatedHeading = page.locator('h2[data-qa="account-created"]');
    this.accountDeletedHeading = page.locator('h2[data-qa="account-deleted"]');
    this.continueButton = page.locator('a[data-qa="continue-button"]');
    this.pageIdentifier = this.continueButton;
  }

  async assertAccountCreated(): Promise<void> {
    await expect(this.accountCreatedHeading).toBeVisible();
    await expect(this.accountCreatedHeading).toContainText(MESSAGES.accountCreated);
  }

  async assertAccountDeleted(): Promise<void> {
    await expect(this.accountDeletedHeading).toBeVisible();
    await expect(this.accountDeletedHeading).toContainText(MESSAGES.accountDeleted);
  }

  async clickContinue(): Promise<void> {
    await this.safeClick(this.continueButton);
  }
}

export class TestCasesPage extends BasePage {
  readonly path = ROUTES.testCases;
  readonly pageIdentifier: Locator;
  readonly header: HeaderComponent;

  readonly title: Locator;
  readonly testCaseLinks: Locator;

  constructor(page: Page) {
    super(page);
    this.header = new HeaderComponent(page);
    this.title = page.locator('h2.title b');
    this.pageIdentifier = this.title;
    this.testCaseLinks = page.locator('.panel-group .panel-title a');
  }

  async assertTestCasesPageVisible(): Promise<void> {
    await expect(this.title).toContainText(/Test Cases/i);
    await this.expectUrlToContain('/test_cases');
  }

  async testCaseCount(): Promise<number> {
    return this.testCaseLinks.count();
  }
}
