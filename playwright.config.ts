import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { getEnvProfile } from './src/config/environments';
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Plain Playwright spec suite (tests-legacy-playwright/), independent of the BDD
// suite. BDD/Gherkin scenarios (features/**/*.feature) run only through cucumber-js
// (see cucumber.js) — this config does not wire up any BDD layer.
const TEST_ENV = process.env.TEST_ENV;
const PROFILE = getEnvProfile(TEST_ENV);
const IS_CI = !!process.env.CI;
const BASE_URL = process.env.BASE_URL ?? PROFILE?.baseUrl ?? 'https://automationexercise.com';
const DEFAULT_TIMEOUT = Number(process.env.DEFAULT_TIMEOUT ?? PROFILE?.defaultTimeout ?? 180_000);
const RETRIES = process.env.RETRIES !== undefined ? Number(process.env.RETRIES) : (PROFILE?.retries ?? (IS_CI ? 2 : 1));
const WORKERS = process.env.WORKERS !== undefined ? Number(process.env.WORKERS) : (PROFILE?.workers ?? (IS_CI ? 2 : 1));
const HEADLESS = process.env.HEADLESS !== undefined ? process.env.HEADLESS !== 'false' : (PROFILE?.headless ?? true);
const SLOW_MO = process.env.SLOW_MO !== undefined ? Number(process.env.SLOW_MO) : (PROFILE?.slowMo ?? 1000);
const REPORT_DIR = TEST_ENV ? `reports/${TEST_ENV}` : 'reports';
const ALLURE_DIR = TEST_ENV ? `allure-results/${TEST_ENV}` : 'allure-results';
export default defineConfig({
  testDir: './tests-legacy-playwright',
  outputDir: TEST_ENV ? `./test-results/${TEST_ENV}` : './test-results',
  timeout: DEFAULT_TIMEOUT,
  expect: { timeout: DEFAULT_TIMEOUT },
  fullyParallel: true,
  forbidOnly: IS_CI,
  retries: RETRIES,
  workers: WORKERS,
  maxFailures: IS_CI ? 10 : 0,
  reporter:
  [
    ['list'],
    ['html', { outputFolder: `${REPORT_DIR}/html`, open: 'never' }],
    ['json', { outputFile: `${REPORT_DIR}/json/results.json` }],
    ['junit', { outputFile: `${REPORT_DIR}/junit/results.xml` }],
    ['allure-playwright', {
      resultsDir: ALLURE_DIR,
      environmentInfo: {
        'Test.Environment': TEST_ENV ?? 'local',
        'Base.URL': BASE_URL,
        'Headless': String(HEADLESS),
        'Retries': String(RETRIES),
        'Workers': String(WORKERS),
        'Slow.Mo.ms': String(SLOW_MO),
        'CI': String(IS_CI),
        'Node.Version': process.version,
      },
    }],
  ],
  use:
  {
    baseURL: BASE_URL,
    headless: HEADLESS,
    launchOptions: { slowMo: SLOW_MO },
    actionTimeout: DEFAULT_TIMEOUT,
    navigationTimeout: DEFAULT_TIMEOUT,
    trace: 'retain-on-failure',
    screenshot: 'on',
    video: 'on',
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
    acceptDownloads: true,
    testIdAttribute: 'data-qa',
  },
  projects:
  [
    // viewport: null + --start-maximized opens the real browser window at the
    // OS's maximized size instead of a fixed viewport. --start-maximized only
    // has effect on Chromium-based engines (edge, chromium); Firefox/WebKit have
    // no equivalent launch flag, so they fall back to their default window size.
    // deviceScaleFactor must be cleared too — Playwright rejects it alongside a null viewport.
    {
      name: 'edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge', viewport: null, deviceScaleFactor: undefined, launchOptions: { slowMo: SLOW_MO, args: ['--start-maximized'] } },
    },
    // {
    //   name: 'chromium',
    //   use: { ...devices['Desktop Chrome'], viewport: null, deviceScaleFactor: undefined, launchOptions: { slowMo: SLOW_MO, args: ['--start-maximized'] } },
    // },
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'], viewport: null, deviceScaleFactor: undefined, launchOptions: { slowMo: SLOW_MO } },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'], viewport: null, deviceScaleFactor: undefined, launchOptions: { slowMo: SLOW_MO } },
    // },
    // { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
  ],
});
