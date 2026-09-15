import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { HeaderComponent, FooterComponent, CartModal } from './components';
import { ROUTES } from '../src/data/routes';

export class HomePage extends BasePage {
  readonly path = ROUTES.home;
  readonly pageIdentifier: Locator;

  readonly header: HeaderComponent;
  readonly footer: FooterComponent;
  readonly cartModal: CartModal;

  readonly carousel: Locator;
  readonly featuresItems: Locator;
  readonly recommendedSection: Locator;
  readonly recommendedAddToCartButtons: Locator;
  readonly scrollUpArrow: Locator;
  readonly subscriptionHeading: Locator;
  readonly fullFledgedHeading: Locator;

  constructor(page: Page) {
    super(page);
    this.header = new HeaderComponent(page);
    this.footer = new FooterComponent(page);
    this.cartModal = new CartModal(page);

    this.pageIdentifier = page.locator('#slider-carousel');
    this.carousel = page.locator('#slider-carousel');
    this.featuresItems = page.locator('.features_items .product-image-wrapper');
    this.recommendedSection = page.locator('.recommended_items');
    this.recommendedAddToCartButtons = this.recommendedSection.locator('.add-to-cart');
    this.scrollUpArrow = page.locator('#scrollUp');
    this.subscriptionHeading = page.locator('.single-widget h2', { hasText: 'Subscription' });
    this.fullFledgedHeading = page.getByRole('heading', { name: /Full-Fledged practice website/i });
  }

  async assertHomePageVisible(): Promise<void> {
    await expect(this.carousel).toBeVisible();
  }

  // --- TC22: Recommended items ---
  async assertRecommendedItemsVisible(): Promise<void> {
    await this.recommendedSection.scrollIntoViewIfNeeded();
    await expect(this.recommendedSection).toBeVisible();
  }

  async addRecommendedProductToCart(index = 0): Promise<string> {
    await this.assertRecommendedItemsVisible();
    const card = this.recommendedSection.locator('.item.active .productinfo').nth(index);
    const productName = (await card.locator('p').innerText()).trim();
    await card.locator('.add-to-cart').click();
    await this.cartModal.waitUntilVisible();
    return productName;
  }

  // --- TC25 / TC26: Scroll behaviour ---
  async assertScrollUpArrowVisible(): Promise<void> {
    await expect(this.scrollUpArrow).toBeVisible();
  }

  async clickScrollUpArrow(): Promise<void> {
    await this.scrollUpArrow.click();
    await this.page.waitForTimeout(1_000);
  }

  async assertFooterSubscriptionInView(): Promise<void> {
    await expect(this.subscriptionHeading).toBeInViewport();
  }

  async assertHeroHeadingInView(): Promise<void> {
    await expect(this.fullFledgedHeading.first()).toBeInViewport();
  }
}
