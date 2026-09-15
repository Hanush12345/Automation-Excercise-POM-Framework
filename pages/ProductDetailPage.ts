import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { HeaderComponent, CartModal } from './components';
import { ROUTES } from '../src/data/routes';
import { MESSAGES } from '../src/data/testData';
import { ProductDetails, ProductReview } from '../src/types';

export class ProductDetailPage extends BasePage {
  readonly path = ROUTES.productDetails(1);
  readonly pageIdentifier: Locator;

  readonly header: HeaderComponent;
  readonly cartModal: CartModal;

  readonly information: Locator;
  readonly productName: Locator;
  readonly category: Locator;
  readonly price: Locator;
  readonly availability: Locator;
  readonly condition: Locator;
  readonly brand: Locator;
  readonly quantityInput: Locator;
  readonly addToCartButton: Locator;

  // Review block (TC21)
  readonly writeReviewTab: Locator;
  readonly reviewNameInput: Locator;
  readonly reviewEmailInput: Locator;
  readonly reviewTextarea: Locator;
  readonly submitReviewButton: Locator;
  readonly reviewSuccessAlert: Locator;

  constructor(page: Page) {
    super(page);
    this.header = new HeaderComponent(page);
    this.cartModal = new CartModal(page);

    this.information = page.locator('.product-information');
    this.pageIdentifier = this.information;
    this.productName = this.information.locator('h2');
    this.category = this.information.locator('p', { hasText: 'Category:' });
    this.price = this.information.locator('span span');
    this.availability = this.information.locator('p', { hasText: 'Availability:' });
    this.condition = this.information.locator('p', { hasText: 'Condition:' });
    this.brand = this.information.locator('p', { hasText: 'Brand:' });
    this.quantityInput = page.locator('#quantity');
    this.addToCartButton = page.locator('button.cart');

    this.writeReviewTab = page.locator('a[href="#reviews"]');
    this.reviewNameInput = page.locator('#name');
    this.reviewEmailInput = page.locator('#email');
    this.reviewTextarea = page.locator('#review');
    this.submitReviewButton = page.locator('#button-review');
    this.reviewSuccessAlert = page.locator('.alert-success span');
  }

  async openById(productId: number): Promise<void> {
    await this.page.goto(ROUTES.productDetails(productId), { waitUntil: 'domcontentloaded' });
    await this.dismissConsentIfPresent();
  }

  /** TC08: every detail field must be present and non-empty. */
  async assertAllDetailsVisible(): Promise<void> {
    for (const field of [this.productName, this.category, this.price, this.availability, this.condition, this.brand]) {
      await expect(field.first()).toBeVisible();
      expect((await field.first().innerText()).trim().length).toBeGreaterThan(0);
    }
  }

  async getProductDetails(): Promise<ProductDetails> {
    const clean = (raw: string): string => raw.split(':').slice(1).join(':').trim();
    return {
      name: (await this.productName.innerText()).trim(),
      category: clean(await this.category.first().innerText()),
      price: (await this.price.first().innerText()).trim(),
      availability: clean(await this.availability.first().innerText()),
      condition: clean(await this.condition.first().innerText()),
      brand: clean(await this.brand.first().innerText()),
    };
  }

  /** TC13: set quantity then add — order matters, the site reads the input on click. */
  async setQuantity(quantity: number): Promise<void> {
    await this.quantityInput.fill(String(quantity));
    await expect(this.quantityInput).toHaveValue(String(quantity));
  }

  async addToCart(): Promise<void> {
    await this.safeClick(this.addToCartButton);
    await this.cartModal.waitUntilVisible();
  }

  // --- TC21: Product review ---
  async assertWriteReviewVisible(): Promise<void> {
    await this.writeReviewTab.scrollIntoViewIfNeeded();
    await expect(this.writeReviewTab).toBeVisible();
  }

  async submitReview(review: ProductReview): Promise<void> {
    await this.writeReviewTab.click();
    await this.fill(this.reviewNameInput, review.name);
    await this.fill(this.reviewEmailInput, review.email);
    await this.fill(this.reviewTextarea, review.review);
    await this.safeClick(this.submitReviewButton);
  }

  async assertReviewSubmitted(): Promise<void> {
    await expect(this.reviewSuccessAlert).toBeVisible();
    await expect(this.reviewSuccessAlert).toContainText(MESSAGES.reviewSuccess);
  }
}
