import { Locator, Page, expect } from '@playwright/test';
import { logger } from '../src/utils/logger';

/**
 * Shared behaviour for every page object.
 * Page objects expose intent ("addFirstProductToCart"), never raw locators, to test code.
 */
export abstract class BasePage {
  protected constructor(protected readonly page: Page) {}

  /** Path relative to baseURL, e.g. '/login'. */
  abstract readonly path: string;

  /** A locator that is present only when this page has finished rendering. */
  abstract readonly pageIdentifier: Locator;

  async open(): Promise<void> {
    logger.step(`Navigate to ${this.path}`);
    await this.page.goto(this.path, { waitUntil: 'domcontentloaded' });
    await this.dismissConsentIfPresent();
  }

  async assertLoaded(): Promise<void> {
    await expect(this.pageIdentifier).toBeVisible();
  }

  async isLoaded(): Promise<boolean> {
    return this.pageIdentifier.isVisible().catch(() => false);
  }

  async currentUrl(): Promise<string> {
    return this.page.url();
  }

  async expectUrlToContain(fragment: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(fragment.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&')));
  }

  async reload(): Promise<void> {
    await this.page.reload({ waitUntil: 'domcontentloaded' });
  }

  /**
   * Google's consent / "Close ad" overlays intercept clicks on this site.
   * Best-effort dismissal — never fails the test.
   */
  async dismissConsentIfPresent(): Promise<void> {
    const candidates = [
      this.page.locator('#dismiss-button'),
      this.page.locator('.close-ad'),
      this.page.getByRole('button', { name: /consent|accept all|agree/i }),
    ];
    for (const candidate of candidates) {
      if (await candidate.first().isVisible({ timeout: 500 }).catch(() => false)) {
        await candidate.first().click({ timeout: 2_000 }).catch(() => undefined);
      }
    }
  }

  async scrollToBottom(): Promise<void> {
    await this.page.mouse.wheel(0, 20_000);
    await this.page.waitForTimeout(500);
  }

  async scrollToTop(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await this.page.waitForTimeout(500);
  }

  async verticalScrollPosition(): Promise<number> {
    return this.page.evaluate(() => Math.round(window.scrollY));
  }

  /** Scrolls a locator into view, then clicks — guards against ad banners covering the target. */
  protected async safeClick(locator: Locator): Promise<void> {
    await locator.scrollIntoViewIfNeeded();
    await locator.click({ timeout: 15_000 });
  }

  protected async fill(locator: Locator, value: string): Promise<void> {
    await locator.scrollIntoViewIfNeeded();
    await locator.fill(value);
  }
}
