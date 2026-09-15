import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';
import { Page } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { SignupPage } from '../pages/SignupPage';
import { AccountStatusPage, TestCasesPage } from '../pages/MiscPages';
import { ProductsPage } from '../pages/ProductsPage';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { PaymentPage } from '../pages/PaymentPage';
import { ContactUsPage } from '../pages/ContactUsPage';
import { RegistrationFlow } from '../src/flows/RegistrationFlow';
import { CheckoutFlow } from '../src/flows/CheckoutFlow';
import { ScenarioState } from '../src/types';

/**
 * Cucumber World for the standalone cucumber-js run. Mirrors the fixtures in
 * src/fixtures/pages.fixture.ts, but built by hand per scenario in
 * support/hooks.ts instead of resolved by Playwright's test runner.
 */
export class CustomWorld extends World {
  page!: Page;
  homePage!: HomePage;
  loginPage!: LoginPage;
  signupPage!: SignupPage;
  accountStatusPage!: AccountStatusPage;
  testCasesPage!: TestCasesPage;
  productsPage!: ProductsPage;
  productDetailPage!: ProductDetailPage;
  cartPage!: CartPage;
  checkoutPage!: CheckoutPage;
  paymentPage!: PaymentPage;
  contactUsPage!: ContactUsPage;
  registrationFlow!: RegistrationFlow;
  checkoutFlow!: CheckoutFlow;
  scenarioState: ScenarioState = {};

  constructor(options: IWorldOptions) {
    super(options);
  }

  initPageObjects(page: Page): void {
    this.page = page;
    this.homePage = new HomePage(page);
    this.loginPage = new LoginPage(page);
    this.signupPage = new SignupPage(page);
    this.accountStatusPage = new AccountStatusPage(page);
    this.testCasesPage = new TestCasesPage(page);
    this.productsPage = new ProductsPage(page);
    this.productDetailPage = new ProductDetailPage(page);
    this.cartPage = new CartPage(page);
    this.checkoutPage = new CheckoutPage(page);
    this.paymentPage = new PaymentPage(page);
    this.contactUsPage = new ContactUsPage(page);
    this.registrationFlow = new RegistrationFlow(page);
    this.checkoutFlow = new CheckoutFlow(page);
  }
}

setWorldConstructor(CustomWorld);
