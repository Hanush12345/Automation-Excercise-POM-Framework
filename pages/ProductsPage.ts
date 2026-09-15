import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { HeaderComponent, FooterComponent, CartModal, CategorySidebar } from './components';
import { ROUTES } from '../src/data/routes';
import { HEADINGS } from '../src/data/testData';

export class ProductsPage extends BasePage {
  readonly path = ROUTES.products;
  readonly pageIdentifier: Locator;

  readonly header: HeaderComponent;
  readonly footer: FooterComponent;
  readonly cartModal: CartModal;
  readonly sidebar: CategorySidebar;

  readonly allProductsHeading: Locator;
  readonly searchedProductsHeading: Locator;
  readonly categoryTitle: Locator;
  readonly productCards: Locator;
  readonly productNames: Locator;
  readonly searchInput: Locator;
  readonly searchButton: Locator;

  constructor(page: Page) {
    super(page);
    this.header = new HeaderComponent(page);
    this.footer = new FooterComponent(page);
    this.cartModal = new CartModal(page);
    this.sidebar = new CategorySidebar(page);

    this.allProductsHeading = page.locator('.features_items h2.title');
    this.pageIdentifier = this.allProductsHeading;
    this.searchedProductsHeading = page.locator('h2.title', { hasText: HEADINGS.searchedProducts });
    this.categoryTitle = page.locator('.features_items h2.title');
    this.productCards = page.locator('.features_items .product-image-wrapper');
    this.productNames = page.locator('.features_items .productinfo p');
    this.searchInput = page.locator('#search_product');
    this.searchButton = page.locator('#submit_search');
  }

  async assertAllProductsHeadingVisible(): Promise<void> {
    await expect(this.allProductsHeading).toContainText(HEADINGS.allProducts);
  }

  async assertProductListNotEmpty(): Promise<void> {
    await expect(this.productCards.first()).toBeVisible();
    expect(await this.productCards.count()).toBeGreaterThan(0);
  }

  async productCount(): Promise<number> {
    return this.productCards.count();
  }

  async allProductNames(): Promise<string[]> {
    return (await this.productNames.allInnerTexts()).map((t) => t.trim()).filter(Boolean);
  }

  // --- TC09 / TC20: Search ---
  async searchFor(term: string): Promise<void> {
    await this.fill(this.searchInput, term);
    await this.safeClick(this.searchButton);
  }

  async assertSearchedProductsHeadingVisible(): Promise<void> {
    await expect(this.searchedProductsHeading).toBeVisible();
  }

  /**
   * The live site's search also matches on category/tag data, not just the product
   * name, so unrelated names can legitimately appear in results. We only assert that
   * the search surfaced at least one genuinely matching product.
   */
  async assertAllResultsMatch(term: string): Promise<void> {
    const names = await this.allProductNames();
    expect(names.length, `Search for "${term}" returned no products`).toBeGreaterThan(0);
    const matching = names.filter((name) => name.toLowerCase().includes(term.toLowerCase()));
    expect(matching.length, `Search for "${term}" returned no products matching the term`).toBeGreaterThan(0);
  }

  // --- TC08: Product detail navigation ---
  async viewProduct(index = 0): Promise<void> {
    const card = this.productCards.nth(index);
    await card.scrollIntoViewIfNeeded();
    await card.locator('a[href^="/product_details/"]').click();
  }

  // --- TC12 / TC20: Add to cart ---
  async addProductToCartByIndex(index: number): Promise<string> {
    const card = this.productCards.nth(index);
    await card.scrollIntoViewIfNeeded();
    const name = (await card.locator('.productinfo p').first().innerText()).trim();
    await card.hover();
    await card.locator('.productinfo a.add-to-cart').first().click();
    await this.cartModal.waitUntilVisible();
    return name;
  }

  async addAllVisibleProductsToCart(count: number): Promise<string[]> {
    const added: string[] = [];
    for (let i = 0; i < count; i++) {
      added.push(await this.addProductToCartByIndex(i));
      await this.cartModal.continueShopping();
    }
    return added;
  }

  // --- TC18: Category products ---
  async assertCategoryPageTitle(expectedFragment: string): Promise<void> {
    await expect(this.categoryTitle).toContainText(new RegExp(expectedFragment, 'i'));
  }

  // --- TC19: Brand products ---
  async assertBrandPageTitle(brandName: string): Promise<void> {
    await expect(this.categoryTitle).toContainText(new RegExp(brandName.replace(/&/g, '&'), 'i'));
  }
}
