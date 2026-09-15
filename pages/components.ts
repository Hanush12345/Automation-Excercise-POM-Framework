import { Locator, Page, expect } from '@playwright/test';
import { MESSAGES } from '../src/data/testData';

/** Site-wide navigation bar. Composed into every page object rather than inherited. */
export class HeaderComponent {
  readonly logo: Locator;
  readonly homeLink: Locator;
  readonly productsLink: Locator;
  readonly cartLink: Locator;
  readonly signupLoginLink: Locator;
  readonly logoutLink: Locator;
  readonly deleteAccountLink: Locator;
  readonly testCasesLink: Locator;
  readonly contactUsLink: Locator;
  readonly loggedInAs: Locator;

  constructor(private readonly page: Page) {
    this.logo = page.locator('.logo img');
    this.homeLink = page.locator('.shop-menu a[href="/"]');
    this.productsLink = page.locator('a[href="/products"]');
    this.cartLink = page.locator('.shop-menu a[href="/view_cart"]');
    this.signupLoginLink = page.locator('a[href="/login"]');
    this.logoutLink = page.locator('a[href="/logout"]');
    this.deleteAccountLink = page.locator('a[href="/delete_account"]');
    this.testCasesLink = page.locator('.shop-menu a[href="/test_cases"]');
    this.contactUsLink = page.locator('a[href="/contact_us"]');
    this.loggedInAs = page.locator('.shop-menu li', { hasText: 'Logged in as' });
  }

  async goToHome(): Promise<void> {
    await this.homeLink.first().click();
  }

  async goToProducts(): Promise<void> {
    await this.productsLink.first().click();
  }

  async goToCart(): Promise<void> {
    await this.cartLink.first().click();
  }

  async goToSignupLogin(): Promise<void> {
    await this.signupLoginLink.first().click();
  }

  async goToTestCases(): Promise<void> {
    await this.testCasesLink.first().click();
  }

  async goToContactUs(): Promise<void> {
    await this.contactUsLink.first().click();
  }

  async logout(): Promise<void> {
    await this.logoutLink.first().click();
  }

  async deleteAccount(): Promise<void> {
    await this.deleteAccountLink.first().click();
  }

  async isUserLoggedIn(): Promise<boolean> {
    return this.loggedInAs.isVisible().catch(() => false);
  }

  async loggedInUserName(): Promise<string> {
    return (await this.loggedInAs.locator('b').innerText()).trim();
  }

  async assertLoggedInAs(userName: string): Promise<void> {
    await expect(this.loggedInAs).toBeVisible();
    await expect(this.loggedInAs).toContainText(userName);
  }

  async assertLoggedOut(): Promise<void> {
    await expect(this.signupLoginLink.first()).toBeVisible();
    await expect(this.loggedInAs).toBeHidden();
  }

  async assertHomePageVisible(): Promise<void> {
    await expect(this.logo).toBeVisible();
    await expect(this.page).toHaveURL(/automationexercise\.com\/?$/);
  }
}

/** Footer subscription widget — shared by Home (TC10) and Cart (TC11). */
export class FooterComponent {
  readonly subscriptionHeading: Locator;
  readonly emailInput: Locator;
  readonly subscribeButton: Locator;
  readonly successAlert: Locator;

  constructor(page: Page) {
    this.subscriptionHeading = page.locator('.single-widget h2', { hasText: MESSAGES.subscriptionHeading });
    // NOTE: the site's own id is misspelled ("susbscribe") — do not "fix" this.
    this.emailInput = page.locator('#susbscribe_email');
    this.subscribeButton = page.locator('#subscribe');
    this.successAlert = page.locator('#success-subscribe .alert-success');
  }

  async assertSubscriptionVisible(): Promise<void> {
    await this.subscriptionHeading.scrollIntoViewIfNeeded();
    await expect(this.subscriptionHeading).toBeVisible();
  }

  async subscribe(email: string): Promise<void> {
    await this.emailInput.scrollIntoViewIfNeeded();
    await this.emailInput.fill(email);
    await this.subscribeButton.click();
  }

  async assertSubscribedSuccessfully(): Promise<void> {
    await expect(this.successAlert).toBeVisible();
    await expect(this.successAlert).toContainText(MESSAGES.subscriptionSuccess);
  }
}

/** "Added!" modal shown after adding a product to the cart. */
export class CartModal {
  readonly modal: Locator;
  readonly title: Locator;
  readonly viewCartLink: Locator;
  readonly continueShoppingButton: Locator;
  readonly backdrop: Locator;

  constructor(page: Page) {
    this.modal = page.locator('#cartModal');
    this.title = this.modal.locator('.modal-title');
    this.viewCartLink = this.modal.locator('a[href="/view_cart"]');
    this.continueShoppingButton = this.modal.locator('button.close-modal');
    this.backdrop = page.locator('.modal-backdrop');
  }

  async waitUntilVisible(): Promise<void> {
    // The modal is shown by an AJAX response handler rather than instantly on
    // click; on this site that round-trip is inconsistently slower than the
    // default 5s expect timeout (see ContactUsPage.assertSubmittedSuccessfully
    // for the same pattern).
    await expect(this.modal).toBeVisible({ timeout: 15_000 });
  }

  async continueShopping(): Promise<void> {
    await this.waitUntilVisible();
    await this.continueShoppingButton.click();
    await expect(this.modal).toBeHidden();
    // The site's Bootstrap modal ignores a show() call made while the previous
    // modal's fade-out/backdrop teardown is still in progress, which silently
    // no-ops the next "Add to Cart" click. Waiting for the backdrop to fully
    // detach ensures the teardown has completed before we click the next one.
    await expect(this.backdrop).toHaveCount(0);
  }

  async viewCart(): Promise<void> {
    await this.waitUntilVisible();
    await this.viewCartLink.click();
  }
}

/** Left-rail Category accordion and Brands panel (TC18, TC19). */
export class CategorySidebar {
  readonly categoryPanel: Locator;
  readonly brandsPanel: Locator;
  readonly brandLinks: Locator;

  constructor(private readonly page: Page) {
    this.categoryPanel = page.locator('#accordian');
    this.brandsPanel = page.locator('.brands_products');
    this.brandLinks = this.brandsPanel.locator('.brands-name li a');
  }

  async assertCategoriesVisible(): Promise<void> {
    await expect(this.categoryPanel).toBeVisible();
  }

  async assertBrandsVisible(): Promise<void> {
    await this.brandsPanel.scrollIntoViewIfNeeded();
    await expect(this.brandsPanel).toBeVisible();
  }

  async expandCategory(categoryName: 'Women' | 'Men' | 'Kids'): Promise<void> {
    await this.categoryPanel.locator(`a[href="#${categoryName}"]`).click();
    await expect(this.page.locator(`#${categoryName}`)).toHaveClass(/in/);
  }

  async selectSubCategory(categoryName: 'Women' | 'Men' | 'Kids', subCategory: string): Promise<void> {
    await this.expandCategory(categoryName);
    await this.page.locator(`#${categoryName}`).getByRole('link', { name: subCategory }).click();
  }

  async selectBrand(brandName: string): Promise<void> {
    await this.brandsPanel.getByRole('link', { name: new RegExp(brandName, 'i') }).first().click();
  }

  async brandNames(): Promise<string[]> {
    const raw = await this.brandLinks.allInnerTexts();
    return raw.map((t) => t.replace(/\(\d+\)/, '').trim()).filter(Boolean);
  }
}
