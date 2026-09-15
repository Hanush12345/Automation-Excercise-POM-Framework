# Requirements Traceability Matrix — automationexercise.com

Maps each of the 26 documented site test cases to its automated feature file, page objects and tags.

The framework runs on plain `cucumber-js` (via `@cucumber/cucumber`), so each row's "Feature file"
is a `.feature` file directly under `features/` (flat, no subfolders) — one per domain, matching
the domain's step definition file under `step_definitions/` (e.g. `cart.feature` <->
`cart.steps.ts`). Steps shared by more than one domain live in `step_definitions/common.steps.ts`
instead of being duplicated. The underlying step definitions drive the same page objects/flows
listed here through a Cucumber `World` (`support/world.ts`, `support/hooks.ts`). The pre-BDD
`.spec.ts` suite is archived under `tests-legacy-playwright/` for reference and is not run.

| TC | Requirement | Feature file | Scenario title | Primary page objects | Tags |
|----|-------------|--------------|-----------------|----------------------|------|
| TC01 | Register User | `features/auth.feature` | TC01 - Register a new user end to end | Home, Login, Signup, AccountStatus | @auth @smoke @regression @account |
| TC02 | Login with correct credentials | `features/auth.feature` | TC02 - Login with valid credentials | Login, Home | @auth @smoke @regression @account |
| TC03 | Login with incorrect credentials | `features/auth.feature` | TC03 - Login with invalid credentials shows an error | Login | @auth @regression |
| TC04 | Logout User | `features/auth.feature` | TC04 - Logout returns the user to the login page | Header, Login | @auth @regression @account |
| TC05 | Register with existing email | `features/auth.feature` | TC05 - Registering with an existing email is rejected | Login | @auth @regression @account |
| TC06 | Contact Us form | `features/contact.feature` | TC06 - Submit the Contact Us form with an attachment | ContactUs | @contact @smoke @regression |
| TC07 | Verify Test Cases page | `features/misc.feature` | TC07 - Test Cases page loads with the expected content | TestCases | @misc @smoke |
| TC08 | All Products + product detail | `features/products.feature` | TC08 - All Products page and product detail page | Products, ProductDetail | @products @smoke @regression |
| TC09 | Search Product | `features/products.feature` | TC09 - Search returns only matching products | Products | @products @regression |
| TC10 | Subscription on home page | `features/misc.feature` | TC10 - Subscribe from the home page footer | Home, Footer | @misc @regression |
| TC11 | Subscription on cart page | `features/misc.feature` | TC11 - Subscribe from the cart page footer | Cart, Footer | @misc @regression |
| TC12 | Add products to cart | `features/cart.feature` | TC12 - Add multiple products to the cart | Products, Cart, CartModal | @cart @smoke @regression |
| TC13 | Verify product quantity in cart | `features/cart.feature` | TC13 - Product quantity set on the detail page persists in the cart | ProductDetail, Cart | @cart @regression |
| TC14 | Place order: register while checkout | `features/checkout.feature` | TC14 - Register while checkout | Cart, Login, Signup, Checkout, Payment | @checkout @smoke @regression @account |
| TC15 | Place order: register before checkout | `features/checkout.feature` | TC15 - Register before checkout | Signup, Checkout, Payment | @checkout @regression @account |
| TC16 | Place order: login before checkout | `features/checkout.feature` | TC16 - Login before checkout | Login, Checkout, Payment | @checkout @regression @account |
| TC17 | Remove products from cart | `features/cart.feature` | TC17 - Remove a product from the cart | Cart | @cart @regression |
| TC18 | View category products | `features/products.feature` | TC18 - View products by category | CategorySidebar, Products | @products @regression |
| TC19 | View and cart brand products | `features/products.feature` | TC19 - View and navigate brand products | CategorySidebar, Products | @products @regression |
| TC20 | Search products, verify cart after login | `features/cart.feature` | TC20 - Cart contents survive logout and login | Products, Cart, Login | @cart @regression @account |
| TC21 | Add review on product | `features/products.feature` | TC21 - Add a review on a product | ProductDetail | @products @regression |
| TC22 | Add to cart from Recommended items | `features/cart.feature` | TC22 - Add to cart from Recommended Items | Home, Cart | @cart @regression |
| TC23 | Verify address details in checkout | `features/checkout.feature` | TC23 - Delivery and billing addresses match the registration data | Checkout | @checkout @regression @account |
| TC24 | Download invoice after purchase | `features/checkout.feature` | TC24 - Download the invoice after placing an order | Payment, fileHelper | @checkout @regression @account |
| TC25 | Scroll up using Arrow button | `features/misc.feature` | TC25 - Scroll up using the arrow button | Home | @misc @regression |
| TC26 | Scroll up without Arrow button | `features/misc.feature` | TC26 - Scroll up without the arrow button | Home | @misc @regression |

**Coverage: 26/26 documented test cases + 1 supplementary check (TC01a, in `features/auth.feature`, tagged `@auth @regression @account`).**

`@account` scenarios create a throwaway registered account; cleanup is automatic via the `After({ tags: '@account' })`
hook in `support/hooks.ts` rather than being repeated per scenario.

## Known coverage gaps / candidate extensions

- Negative validation on the signup form (blank mandatory fields, malformed email)
- Payment rejection paths — the site accepts any card, so there is no negative payment case
- API-layer coverage of `/api/*` endpoints the site exposes
- Accessibility scans (`@axe-core/playwright`) and visual regression baselines
- Only Chromium is exercised — `support/hooks.ts` hardcodes `chromium.launch()`; no cross-browser matrix like the old Playwright-projects setup had
