import { test as base, expect } from '@playwright/test';
import { BLOCKED_RESOURCE_PATTERNS, ENV } from '../config/env';
import { HomePage } from '../../pages/HomePage';
import { LoginPage } from '../../pages/LoginPage';
import { SignupPage } from '../../pages/SignupPage';
import { ProductsPage } from '../../pages/ProductsPage';
import { ProductDetailPage } from '../../pages/ProductDetailPage';
import { CartPage } from '../../pages/CartPage';
import { CheckoutPage } from '../../pages/CheckoutPage';
import { PaymentPage } from '../../pages/PaymentPage';
import { ContactUsPage } from '../../pages/ContactUsPage';
import { AccountStatusPage, TestCasesPage } from '../../pages/MiscPages';
import { RegistrationFlow } from '../flows/RegistrationFlow';
import { CheckoutFlow } from '../flows/CheckoutFlow';
import { ScenarioState } from '../types';

type PageObjects = {
  homePage: HomePage;
  loginPage: LoginPage;
  signupPage: SignupPage;
  accountStatusPage: AccountStatusPage;
  productsPage: ProductsPage;
  productDetailPage: ProductDetailPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  paymentPage: PaymentPage;
  contactUsPage: ContactUsPage;
  testCasesPage: TestCasesPage;
  registrationFlow: RegistrationFlow;
  checkoutFlow: CheckoutFlow;
  /** Fresh per test — lets multi-step specs share data (e.g. a registered user) across steps. */
  scenarioState: ScenarioState;
};

/**
 * Extended test object for the plain Playwright suite under tests-legacy-playwright/.
 * BDD scenarios (the Gherkin feature files) run through cucumber-js instead — see
 * cucumber/support/world.ts for their equivalent page-object wiring. Import `test`
 * and `expect` from here — never directly from @playwright/test — or you lose ad
 * blocking and the page objects.
 */
export const test = base.extend<PageObjects>({
  // Auto-fixture: runs before every test, blocks the ad traffic that makes this site flaky.
  page: async ({ page }, use) => {
    if (ENV.blockAds) {
      await page.route('**/*', (route) => {
        const url = route.request().url();
        return BLOCKED_RESOURCE_PATTERNS.some((pattern) => pattern.test(url))
          ? route.abort()
          : route.continue();
      });
    }
    await use(page);
  },

  homePage: async ({ page }, use) => use(new HomePage(page)),
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  signupPage: async ({ page }, use) => use(new SignupPage(page)),
  accountStatusPage: async ({ page }, use) => use(new AccountStatusPage(page)),
  productsPage: async ({ page }, use) => use(new ProductsPage(page)),
  productDetailPage: async ({ page }, use) => use(new ProductDetailPage(page)),
  cartPage: async ({ page }, use) => use(new CartPage(page)),
  checkoutPage: async ({ page }, use) => use(new CheckoutPage(page)),
  paymentPage: async ({ page }, use) => use(new PaymentPage(page)),
  contactUsPage: async ({ page }, use) => use(new ContactUsPage(page)),
  testCasesPage: async ({ page }, use) => use(new TestCasesPage(page)),
  registrationFlow: async ({ page }, use) => use(new RegistrationFlow(page)),
  checkoutFlow: async ({ page }, use) => use(new CheckoutFlow(page)),
  scenarioState: async ({}, use) => use({}),
});

export { expect };
