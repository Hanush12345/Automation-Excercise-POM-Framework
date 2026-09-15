import {
  Before,
  After,
  AfterStep,
  BeforeAll,
  AfterAll,
  setDefaultTimeout,
  Status,
  ITestCaseHookParameter,
  ITestStepHookParameter,
} from '@cucumber/cucumber';
import { Browser, BrowserContext, BrowserContextOptions, chromium, firefox, webkit, devices } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { CustomWorld } from './world';
import { BLOCKED_RESOURCE_PATTERNS, ENV } from '../src/config/env';
// Plain CommonJS require of the root config, not a TS import: cucumber.js sits
// outside tsconfig's `include` and `allowJs` is off, so a real `import` would
// fail typecheck. Both rule names are listed because @typescript-eslint renamed
// no-var-requires to no-require-imports - keep both so this stays silenced
// across plugin versions.
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const { ENABLED_BROWSERS } = require('../cucumber.js');

// screenshot/video mirror playwright.config.ts's `screenshot: 'on'` / `video: 'on'`
// (every scenario, not just failures), but cucumber.js's config schema has no
// field for either - so, like HEADLESS/BROWSER, they're implemented here
// instead. Rather than writing loose files under test-results/ (which would
// need its own REPORT_DIR/REPORT_KEY-style bookkeeping duplicated from
// cucumber.js), both are attached directly via this.attach() so they're
// embedded inline in the html/allure-cucumberjs reports for every scenario.
const VIDEO_DIR = path.join('test-results', '.cucumber-video-tmp');
fs.mkdirSync(VIDEO_DIR, { recursive: true });

// Cucumber's own per-step default (5s) is too short for multi-page flows like
// registration; align it with ENV.defaultTimeout, the same DEFAULT_TIMEOUT
// budget playwright.config.ts resolves (env var > TEST_ENV profile > 180s).
setDefaultTimeout(ENV.defaultTimeout);

// BROWSER selects the engine: chromium | firefox | webkit | edge. With no
// BROWSER env var set, this falls back to the first entry left enabled in
// cucumber.js's ENABLED_BROWSERS list (mirrors playwright.config.ts's
// `projects` array - comment an entry out there to disable it everywhere).
// DEVICE optionally emulates a Playwright device profile (e.g. "Pixel 7", "iPhone 14")
// on top of that engine, for mobile scenarios.
const BROWSER_NAME = (process.env.BROWSER ?? ENABLED_BROWSERS[0]).toLowerCase();
const DEVICE_NAME = process.env.DEVICE;

let browser: Browser;
let context: BrowserContext;

// Live terminal feedback ("progress bar"), deliberately NOT implemented as a
// Cucumber formatter. cucumber.js's `format` array (progress/allure/html) is
// the "correct" place for this, but empirically, adding a `--format` CLI flag
// - the only way to make a formatter's stdout output show up reliably once
// output is piped (e.g. scripts/run-cross-browser.js prefixing each browser's
// lines) - corrupts the allure-cucumberjs formatter's writes (it silently
// wrote only 1 of 3 expected result files per scenario instead of the full
// set). Printing directly via console.log/process.stdout.write here instead
// never touches Cucumber's formatter/CLI machinery, so it can't affect Allure
// output, and - like the existing logger.step calls in pages/BasePage.ts -
// always shows up regardless of TTY/piping.
let stepsPassed = 0;
let stepsFailed = 0;
let scenariosPassed = 0;
let scenariosFailed = 0;

AfterStep(function (this: CustomWorld, { result }: ITestStepHookParameter) {
  if (result.status === Status.PASSED) {
    stepsPassed++;
    process.stdout.write('.');
  } else if (result.status === Status.FAILED) {
    stepsFailed++;
    process.stdout.write('F');
  } else {
    process.stdout.write('-');
  }
});

// willBeRetried attempts are re-run wholesale, so only the final attempt of a
// scenario counts toward the summary - otherwise a scenario that fails once
// then passes on retry would be tallied as both a failure and a pass.
After(function (this: CustomWorld, { result, willBeRetried }: ITestCaseHookParameter) {
  if (willBeRetried) return;
  if (result?.status === Status.PASSED) scenariosPassed++;
  else scenariosFailed++;
});

AfterAll(function () {
  const totalScenarios = scenariosPassed + scenariosFailed;
  const totalSteps = stepsPassed + stepsFailed;
  process.stdout.write(
    `\n${totalScenarios} scenarios (${scenariosPassed} passed, ${scenariosFailed} failed), ` +
      `${totalSteps} steps (${stepsPassed} passed, ${stepsFailed} failed)\n`,
  );
});

// --start-maximized only has effect on Chromium-based engines (chromium, edge);
// Firefox/WebKit have no equivalent launch flag, so they fall back to their
// default window size. Only applied when actually headed and not emulating a
// mobile DEVICE — in headless mode there is no real screen to maximize against,
// and forcing viewport:null there roughly doubles page-load time (measured:
// ~18s vs ~10s to automationexercise.com), causing spurious navigation timeouts.
const MAXIMIZE_ARGS = ['--start-maximized'];
const HEADLESS = ENV.headless;
const SHOULD_MAXIMIZE = !DEVICE_NAME && !HEADLESS;
// Matches playwright.config.ts's use.launchOptions.slowMo (per-project 'edge'
// launchOptions repeats the same value) so headed runs are equally paced.
const SLOW_MO = ENV.slowMo;

BeforeAll(async function () {
  switch (BROWSER_NAME) {
    case 'chromium':
      browser = await chromium.launch({ headless: HEADLESS, slowMo: SLOW_MO, args: SHOULD_MAXIMIZE ? MAXIMIZE_ARGS : [] });
      break;
    case 'firefox':
      browser = await firefox.launch({ headless: HEADLESS, slowMo: SLOW_MO });
      break;
    case 'webkit':
      browser = await webkit.launch({ headless: HEADLESS, slowMo: SLOW_MO });
      break;
    case 'edge':
      browser = await chromium.launch({ headless: HEADLESS, slowMo: SLOW_MO, channel: 'msedge', args: SHOULD_MAXIMIZE ? MAXIMIZE_ARGS : [] });
      break;
    default:
      throw new Error(`Unknown BROWSER "${BROWSER_NAME}". Use one of: chromium, firefox, webkit, edge.`);
  }
});

AfterAll(async function () {
  await browser.close();
});

Before(async function (this: CustomWorld) {
  let deviceOptions: BrowserContextOptions = {};
  if (DEVICE_NAME) {
    const device = devices[DEVICE_NAME];
    if (!device) throw new Error(`Unknown DEVICE "${DEVICE_NAME}". See Playwright's device list (e.g. "Pixel 7", "iPhone 14").`);
    deviceOptions = device;
  } else if (SHOULD_MAXIMIZE) {
    // viewport: null lets the window (maximized via --start-maximized above) dictate
    // the page size instead of a fixed viewport; deviceScaleFactor must be cleared
    // alongside it or Playwright rejects the combination.
    deviceOptions = { viewport: null, deviceScaleFactor: undefined };
  } else {
    deviceOptions = { viewport: { width: 1440, height: 900 } };
  }
  // ignoreHTTPSErrors/acceptDownloads mirror playwright.config.ts's global `use`
  // block; recordVideo mirrors its `video: 'retain-on-failure'` (see After hook
  // below, which deletes the file unless the scenario failed).
  context = await browser.newContext({
    ...deviceOptions,
    baseURL: ENV.baseUrl,
    ignoreHTTPSErrors: true,
    acceptDownloads: true,
    recordVideo: { dir: VIDEO_DIR },
  });
  const page = await context.newPage();
  if (ENV.blockAds) {
    await page.route('**/*', (route) => {
      const url = route.request().url();
      return BLOCKED_RESOURCE_PATTERNS.some((pattern) => pattern.test(url))
        ? route.abort()
        : route.continue();
    });
  }
  this.initPageObjects(page);
});

// Runs last (see ordering note below), once the page is done being used by
// every other After hook - video isn't finalized until the context closes, so
// the path is only readable afterwards.
After(async function (this: CustomWorld) {
  const video = this.page?.video();
  await context.close();
  if (!video) return;
  try {
    const videoPath = await video.path();
    this.attach(await fs.promises.readFile(videoPath), 'video/webm');
    await fs.promises.unlink(videoPath);
  } catch {
    // Best-effort only - a video read/cleanup failure shouldn't mask the
    // scenario's actual pass/fail result.
  }
});

// Cucumber runs multiple After hooks in reverse definition order, so this
// account-cleanup hook is declared after the context-close hook above —
// that makes it run before it, while the page is still open.
After({ tags: '@account' }, async function (this: CustomWorld) {
  const user = this.scenarioState.user;
  if (!user || this.scenarioState.accountDeleted) return;

  await this.homePage.open();
  if (!(await this.homePage.header.isUserLoggedIn())) {
    await this.homePage.header.goToSignupLogin();
    await this.loginPage.login({ email: user.email, password: user.password });
  }
  await this.registrationFlow.deleteCurrentAccount();
});

// Declared last so it runs first (before the @account cleanup above touches
// the page), capturing the page as it actually looked at the end of the
// scenario rather than after any teardown navigation.
After(async function (this: CustomWorld) {
  if (!this.page || this.page.isClosed()) return;
  try {
    const screenshot = await this.page.screenshot({ fullPage: true });
    this.attach(screenshot, 'image/png');
  } catch {
    // Best-effort only - see comment on the video-cleanup After hook above.
  }
});
