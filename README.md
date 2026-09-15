# Automation Exercise — Cucumber + Playwright + TypeScript POM Framework

End-to-end UI automation framework for **https://automationexercise.com**, covering all 26 documented test cases.

Architecture: **BDD (Cucumber/Gherkin via `@cucumber/cucumber`) + Page Object Model + Component Objects + Task/Flow layer.** Cucumber owns scenario parsing and execution; Playwright (`@playwright/test`) is used underneath purely as the browser driver and assertion library (`chromium.launch()`, `expect()`) — there is no Playwright test runner or project matrix in this framework.

---

## 1. Quick start

```powershell
cd D:\Automation-Exercise-POM-Framework
npm install
Copy-Item .env.example .env
npx cucumber-js
```

`npm install` runs `playwright install --with-deps chromium` automatically via the `postinstall` hook.

---

## 2. Folder structure

```
D:\Automation-Exercise-POM-Framework\
├── .github/workflows/cucumber.yml     # CI: nightly + PR regression (chromium)
├── docs/
│   └── TRACEABILITY-MATRIX.md         # RTM: requirement -> spec -> page object
├── resources/
│   └── upload-sample.txt              # attachment fixture for TC06
├── features/                           # flat, no subfolders — one .feature file per domain
│   ├── auth.feature                   # TC01, TC01a, TC02-05
│   ├── cart.feature                   # TC12,13,17,20,22
│   ├── checkout.feature               # TC14-16,23,24
│   ├── contact.feature                # TC06
│   ├── misc.feature                   # TC07,10,11,25,26
│   └── products.feature               # TC08,09,18,19,21
├── support/
│   ├── world.ts                       # CustomWorld — holds page objects/flows for one scenario
│   └── hooks.ts                       # Before/After/BeforeAll/AfterAll: browser lifecycle, ad blocking, @account cleanup
├── step_definitions/                  # Given/When/Then bound to CustomWorld — one file per feature
│                                       # domain above, same base name (e.g. cart.feature <-> cart.steps.ts);
│                                       # common.steps.ts holds only steps shared by 2+ feature files
├── pages/
│   ├── BasePage.ts                    # abstract base: navigation, scroll, safe click
│   ├── CartPage.ts
│   ├── CheckoutPage.ts
│   ├── ContactUsPage.ts
│   ├── HomePage.ts
│   ├── LoginPage.ts                   # hosts both signup and login forms
│   ├── MiscPages.ts                   # AccountStatusPage + TestCasesPage (small standalone pages)
│   ├── PaymentPage.ts
│   ├── ProductDetailPage.ts
│   ├── ProductsPage.ts
│   ├── SignupPage.ts
│   └── components.ts                  # HeaderComponent, FooterComponent, CartModal, CategorySidebar
├── cucumber.js                        # cucumber-js config: paths, step glob, ts-node loader, HTML report
├── tests-legacy-playwright/           # archived pre-BDD .spec.ts suite, kept for reference only (not run)
├── src/
│   ├── config/
│   │   └── env.ts                     # typed env access + ad/analytics block list
│   ├── data/
│   │   ├── routes.ts                  # single source of truth for URLs
│   │   └── testData.ts                # expected messages, categories, brands, search terms
│   ├── flows/
│   │   ├── CheckoutFlow.ts            # cart -> checkout -> payment -> order placed
│   │   └── RegistrationFlow.ts        # register / register-in-checkout / delete account
│   ├── types/
│   │   └── index.ts                   # UserAccount, CartRow, CardDetails, ...
│   └── utils/
│       ├── dataGenerator.ts           # faker-backed builders, unique emails
│       ├── fileHelper.ts              # download handling for TC24
│       ├── logger.ts
│       └── priceHelper.ts             # "Rs. 500" -> 500, line-total maths
├── .env.example
├── .eslintrc.json
├── .prettierrc
├── package.json
└── tsconfig.json
```

Generated at runtime: `reports/cucumber/`, `allure-results/cucumber/`, `reports/allure/cucumber/`, `downloads/`.

---

## 3. Layering rules

| Layer | Responsibility | Must not |
|-------|----------------|----------|
| **Feature** (`features/**/*.feature`) | Gherkin scenarios in business language, tagged `@smoke`/`@regression`/domain/`@account` | Contain CSS selectors or literal test data |
| **Step definition** (`step_definitions/`) | Given/When/Then bound to page objects/flows via the Cucumber `World`, assertions on business outcomes | Contain CSS selectors or `page.click` |
| **Flow** (`src/flows/`) | Multi-page journeys (register, checkout) | Own locators |
| **Page** (`pages/`) | Locators + intent methods for one page | Instantiate other page objects |
| **Component** (`pages/components.ts`) | Reusable UI regions (header, footer, modals) | Know about specific pages |
| **World / hooks** (`support/`) | Launch the browser, build page objects per scenario, apply network routing, hold per-scenario `scenarioState`, run `@account` cleanup | Assert |

Step definitions access page objects and flows via `this.<pageObject>` on the Cucumber `World` (`support/world.ts`), never by importing `@playwright/test`'s `test`/`page` directly — the `World` is what wires a fresh browser context, ad blocking, and page objects into every scenario (`support/hooks.ts`). Cross-step data within one scenario (e.g. a registered user's credentials) is shared via `this.scenarioState`, since each Given/When/Then is a separate function call against the same `World` instance for that scenario. Scenarios that create a throwaway account are tagged `@account`, which triggers an automatic best-effort cleanup `After` hook (`support/hooks.ts`) so cleanup doesn't need to be repeated in every scenario.

---

## 4. Running tests

Two independent runners exist. BDD (`features/**/*.feature`) always runs through `cucumber-js`; `tests-legacy-playwright/` (plain, non-BDD specs) runs through Playwright's own test runner. `npm test` defaults to the cucumber suite.

### Cucumber (BDD)

| Command | Scope |
|---------|-------|
| `npm test` / `npm run cucumber` | Full suite (all `.feature` files under `features/`) |
| `npm run cucumber:smoke` | `@smoke` tagged (build verification) |
| `npm run cucumber:regression` | `@regression` tagged (full pass) |
| `npm run cucumber:auth` / `:cart` / `:checkout` | Scenarios tagged `@auth` / `@cart` / `@checkout` |
| `npm run cucumber:headed` | Watch it run (`HEADLESS=false`) |
| `npm run cucumber:headed:smoke` / `:regression` | Headed + tag filter combined |

Configured by `cucumber.js` (feature glob, step glob, `ts-node` loader, retries). Two reports are generated automatically on every run:
- Cucumber's own HTML report at `reports/cucumber/report.html`
- Allure raw results at `allure-results/cucumber/` (via `allure-cucumberjs/reporter`) — build the viewable report with `npm run cucumber:allure:generate` (outputs to `reports/allure/cucumber/`), or `npm run cucumber:allure:serve` to build and open it in one step. No JUnit output in this pipeline.

**Browser / device selection** (`support/hooks.ts` reads these env vars):

| Command | Runs on |
|---------|---------|
| `npm run cucumber:chromium` | Chromium (default if `BROWSER` unset) |
| `npm run cucumber:firefox` | Firefox |
| `npm run cucumber:webkit` | WebKit |
| `npm run cucumber:edge` | Microsoft Edge (`channel: 'msedge'`) |
| `npm run cucumber:mobile` | Chromium emulating a Pixel 7 (`DEVICE="Pixel 7"`) |

`BROWSER` accepts `chromium`/`firefox`/`webkit`/`edge`; `DEVICE` accepts any [Playwright device name](https://playwright.dev/docs/emulation#devices) (e.g. `"iPhone 14"`). Combine env vars manually for anything not covered by a named script, e.g. `cross-env BROWSER=firefox HEADLESS=false cucumber-js --tags @smoke`.

### Playwright (plain specs)

| Command | Scope |
|---------|-------|
| `npm run playwright` | Full `tests-legacy-playwright/` suite (`edge` project) |
| `npm run playwright:smoke` / `:regression` | Tag-filtered via `--grep` |
| `npm run playwright:headed` / `:debug` | Watch it run / step through |
| `npm run report` | Open the last HTML report |
| `npm run allure:generate` / `:open` / `:serve` | Allure reporting from `allure-results/` |

### Both

| Command | Scope |
|---------|-------|
| `npm run codegen` | Record selectors against the live site |
| `npm run typecheck` | `tsc --noEmit` |

---

## 5. Test data strategy

Every test that registers a user calls `buildUser()`, which mints a **timestamped unique email**, and deletes the account in a cleanup step. That combination means:

- tests are re-runnable without "Email Address already exist!" collisions
- the site is left clean after each run

`.env` holds a fallback pre-seeded account for anyone who wants to skip registration in local debugging. It is git-ignored; **never commit real credentials.**

---

## 6. Site-specific traps this framework already handles

These are the things that break naive suites on this site:

1. **Ad and consent iframes intercept clicks.** `support/hooks.ts` aborts requests to ad/analytics domains (`src/config/env.ts` → `BLOCKED_RESOURCE_PATTERNS`). Set `BLOCK_ADS=false` in `.env` to see the unfiltered site.
2. **The subscription input id is misspelled** in the site's own HTML (`#susbscribe_email`). Do not "correct" it.
3. **Contact Us fires a native `window.confirm`.** The dialog handler is registered *before* the click in `ContactUsPage.submitAndAcceptDialog()` — reversing that order makes the test hang.
4. **Quantity must be set before clicking Add to cart** on the product detail page (TC13).
5. **Checkout address renders city/state/zip on one combined line**, so `CheckoutPage` asserts field membership rather than exact line-by-line equality.
6. `data-qa` attributes are the most stable selectors this site exposes — prefer them over CSS classes when adding new locators.

---

## 7. Selector verification

Selectors are built against this site's `data-qa` contract, which is the most stable thing it exposes. Before trusting a CI baseline, do one verification pass:

```powershell
npm run test:smoke -- --tags @smoke
```

Anything that fails on a locator rather than an assertion is a selector drift — fix it in the page object only, never in the step definition. `npm run codegen` will give you the current DOM.

---

## 8. Extending the framework

- **New page** → extend `BasePage`, implement `path` and `pageIdentifier`, instantiate it in `support/world.ts`'s `initPageObjects()`.
- **New journey spanning pages** → add a method to a class in `src/flows/`.
- **New expected text** → add it to `src/data/testData.ts`; never hardcode strings in step definitions.
- **New test case** → add a `Scenario` to an existing `.feature` file (or a new one directly under `features/`, with a matching `step_definitions/<domain>.steps.ts`), reusing existing Given/When/Then phrases where the action already exists. Only add a new step definition when no existing phrase fits — put it in the matching `<domain>.steps.ts` file if it's specific to that domain, or in `common.steps.ts` if it's shared by more than one domain. Run `npx cucumber-js --dry-run` to confirm every step resolves before running for real.
- **Scenario needs a throwaway account** → tag it `@account` and use the existing `Given I have registered a new account` step; cleanup is automatic.

---

## 9. Coverage

26/26 documented test cases automated. See `docs/TRACEABILITY-MATRIX.md` for the requirement-to-spec mapping and the known gap list.
