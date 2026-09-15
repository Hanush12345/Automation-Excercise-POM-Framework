// Config for the `npx cucumber-js` / `npm run cucumber*` entry point — the BDD
// runner. Independent of playwright.config.ts, which runs the plain (non-BDD)
// suite under tests-legacy-playwright/ instead.
//
// Cucumber's own config schema (requireModule/require/format/formatOptions/
// retry/parallel, under the `default` key below) has no field for browser/
// headless, so those live alongside it in this same file instead:
// ENABLED_BROWSERS below (mirrors playwright.config.ts's `projects` list) and
// src/config/env.ts's ENV.headless (read by support/hooks.ts when it launches
// the browser). ENV.headless already defaults to `false` (headed), so
// `cucumber-js features/x.feature` runs headed out of the box with no
// HEADLESS/BROWSER flags needed; set HEADLESS=true to run headless instead.
//
// Same story for screenshot/video (playwright.config.ts's `screenshot: 'only-
// on-failure'` / `video: 'retain-on-failure'`): no field for them here either,
// so support/hooks.ts's After hooks capture a screenshot + video only when a
// scenario fails and attach them via this.attach(), so they show up inline in
// the html/allure reports below without any extra config in this file.

// Same TEST_ENV-keyed report/allure directory convention as playwright.config.ts
// (reports/${TEST_ENV} and allure-results/${TEST_ENV}, falling back to the
// unkeyed dir when TEST_ENV is unset).
const TEST_ENV = process.env.TEST_ENV;
const REPORT_DIR = TEST_ENV ? `reports/${TEST_ENV}` : 'reports';
const ALLURE_DIR = TEST_ENV ? `allure-results/${TEST_ENV}` : 'allure-results';

// Mirrors playwright.config.ts's `projects` list: comment a browser out below to
// disable it everywhere - support/hooks.ts (single `npx cucumber-js` / `npm run
// cucumber*` runs) and scripts/run-cross-browser.js (multi-process cross-browser
// runs) both require() this file and read this list instead of requiring
// BROWSER/BROWSERS to be set on the command line. The first entry left enabled
// is what a bare `npx cucumber-js` run launches (it can only ever drive one
// browser per process); every entry left enabled is what `npm run
// cucumber:cross-browser` / `node scripts/run-cross-browser.js` launches side
// by side.
const ENABLED_BROWSERS = [
  //'chromium',
  //'firefox',
  ///'webkit',
  'edge',
];

const RETRIES = process.env.RETRIES !== undefined ? Number(process.env.RETRIES) : (process.env.CI ? 2 : 1);

// Mirrors playwright.config.ts's WORKERS pattern: N cucumber-js worker
// processes pick up scenarios concurrently. support/hooks.ts's BeforeAll/AfterAll
// run once per worker process (not once per suite), so each worker launches and
// owns its own browser instance - this is what actually makes scenarios run in
// parallel browsers, not just parallel Node processes.
const WORKERS = process.env.WORKERS !== undefined ? Number(process.env.WORKERS) : (process.env.CI ? 2 : 1);

// Keyed by BROWSER (+ DEVICE, if emulating one - see support/hooks.ts) so that
// running several browsers/devices side by side (see scripts/run-cross-browser.js
// / npm run cucumber:cross-browser) doesn't have separate cucumber-js processes
// overwrite each other's single-file HTML report - e.g. desktop chromium and a
// "Pixel 7" mobile-emulation leg both launch BROWSER=chromium, so BROWSER alone
// isn't a unique enough key once mobile legs are in the mix.
// Default mirrors support/hooks.ts's own BROWSER_NAME default - both fall
// back to this file's ENABLED_BROWSERS[0] (this constant is otherwise
// independent - it only names the report/allure folder and has no effect on
// which engine actually launches) - kept in sync so an un-set BROWSER still
// gets a report folder name that matches the engine actually launched.
const BROWSER_NAME = (process.env.BROWSER ?? ENABLED_BROWSERS[0]).toLowerCase();
const DEVICE_NAME = process.env.DEVICE;
const REPORT_KEY = DEVICE_NAME ? `${BROWSER_NAME}-${DEVICE_NAME.replace(/\s+/g, '')}` : BROWSER_NAME;

module.exports = {
  ENABLED_BROWSERS,
  default: {
    // No explicit `paths` here on purpose: Cucumber's own built-in default is
    // this exact glob when none is set, and `paths` merges with (rather than
    // replaces) any CLI-supplied path in this Cucumber version - so setting it
    // here made `cucumber-js features/auth.feature` run the whole suite
    // instead of just that file. Omitting it gives identical "run everything"
    // behaviour with no path argument, while letting a CLI path actually scope
    // the run.
    requireModule: ['ts-node/register'],
    require: ['support/**/*.ts', 'step_definitions/**/*.ts'],
    // Deliberately no 'progress'/'progress-bar' formatter here, and don't add
    // one via a `--format` CLI flag either: empirically, adding a CLI
    // `--format` on top of this array corrupts the allure-cucumberjs
    // formatter's writes (confirmed: it silently wrote only 1 of 3 expected
    // result files per scenario instead of the full set - not a TTY/piping
    // issue, reproduced with a real terminal-attached run too). Live
    // terminal feedback comes from support/hooks.ts's AfterStep/After/AfterAll
    // hooks instead (Playwright's 'list' reporter equivalent), which print via
    // plain process.stdout.write and never touch Cucumber's formatter/CLI
    // machinery, so they can't affect this. 'json'/'junit' below are built-in
    // config-array formatters (not CLI flags), added to mirror
    // playwright.config.ts's json/junit reporters.
    format: [
      ['html', `${REPORT_DIR}/cucumber/${REPORT_KEY}/html/report.html`],
      ['json', `${REPORT_DIR}/cucumber/${REPORT_KEY}/json/results.json`],
      ['junit', `${REPORT_DIR}/cucumber/${REPORT_KEY}/junit/results.xml`],
      'allure-cucumberjs/reporter',
    ],
    // allure-results/cucumber (now namespaced under ALLURE_DIR per TEST_ENV,
    // same as playwright.config.ts's ALLURE_DIR) stays shared across
    // browsers/workers/devices on purpose: each result file is uuid-named, so
    // concurrent processes can write into it safely and
    // `npm run cucumber:allure:generate` still produces one merged report
    // covering every leg.
    formatOptions: { resultsDir: `${ALLURE_DIR}/cucumber` },
    publishQuiet: true,
    retry: RETRIES,
    parallel: WORKERS,
  },
};
