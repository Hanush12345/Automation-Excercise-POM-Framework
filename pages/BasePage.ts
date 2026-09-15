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
    // page.mouse.wheel() is unreliable in Firefox: the delta is applied by the
    // compositor asynchronously, so a fixed wait races it and the page can end
    // up barely scrolled (TC25/TC26 failed in CI on Firefox with "viewport
    // ratio 0" while passing on Chromium). Scroll deterministically instead,
    // then wait for the position to settle rather than guessing a duration -
    // the footer lazy-loads, which extends scrollHeight after the first jump.
    await this.page.evaluate(() => {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' as ScrollBehavior });
    });

    await this.page
      .waitForFunction(
        () => {
          const state = window as Window & { __prevScrollY?: number };
          const settled = state.__prevScrollY === window.scrollY;
          state.__prevScrollY = window.scrollY;
          // Re-issue the scroll each poll so lazily-added footer content is
          // still reached once it extends the document.
          if (!settled) window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' as ScrollBehavior });
          return settled && window.scrollY > 0;
        },
        undefined,
        { timeout: 10_000, polling: 250 }
      )
      // A page shorter than the viewport never scrolls; that is not a failure
      // here, the caller's own assertion decides whether that is acceptable.
      .catch(() => undefined);
  }

  async scrollToTop(): Promise<void> {
    // Smooth scrolling is deliberate (TC26 exercises the no-arrow path), but
    // its duration is browser-dependent, so wait for the position to actually
    // reach the top instead of a fixed pause - Firefox was still at y=26 when
    // a 500ms wait expired, failing the "scroll position is zero" assertion.
    await this.page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await this.page
      .waitForFunction(() => window.scrollY === 0, undefined, { timeout: 10_000, polling: 100 })
      .catch(() => undefined);
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
