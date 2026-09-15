#!/usr/bin/env node
'use strict';

// BDD equivalent of playwright.config.ts's `projects` list: runs the Cucumber
// suite against several browsers (and, optionally, mobile device emulations)
// at the same time, each in its own `cucumber-js` process (which itself fans
// out across WORKERS parallel workers per cucumber.js). So N legs x M workers
// all run concurrently.
//
// With no env vars set, this runs every browser left enabled in cucumber.js's
// ENABLED_BROWSERS list, headed (see src/config/env.ts's ENV.headless
// default), against the whole suite (or whatever path/--tags/--name you
// pass) - no BROWSERS/HEADLESS typing needed. Comment a browser out of that
// list to stop it running here too.
//
// Usage (args are passed straight to `node`, not npm, so no `--` needed):
//   node scripts/run-cross-browser.js
//   node scripts/run-cross-browser.js features/auth.feature
//   node scripts/run-cross-browser.js --tags "@smoke"
//   node scripts/run-cross-browser.js --name "TC01 -"
//   npm run cucumber:cross-browser -- --tags @smoke
//   BROWSERS=chromium,firefox WORKERS=4 node scripts/run-cross-browser.js
//   HEADLESS=false BROWSERS=chromium,firefox,webkit,edge DEVICES="Pixel 7,iPhone 14" node scripts/run-cross-browser.js
//
// HEADLESS, WORKERS, RETRIES etc. are read directly from the environment by
// cucumber.js/support/hooks.ts - just set them before invoking this script
// (or via cross-env) to override the config-file defaults for one run; they
// apply to every leg.

const { spawn } = require('child_process');
const path = require('path');

// BROWSERS/DEVICES/TAGS/FEATURE/NAME below are read from process.env before
// any child process starts, so - unlike cucumber.js/support/hooks.ts, which
// pick up .env via src/config/env.ts - this script must load .env itself.
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

const { ENABLED_BROWSERS } = require('../cucumber.js');

// Defaults to every browser left enabled in cucumber.js's ENABLED_BROWSERS
// list (mirrors playwright.config.ts's `projects` array); BROWSERS env var
// still wins for one-off overrides.
const BROWSERS = (process.env.BROWSERS ?? ENABLED_BROWSERS.join(','))
  .split(',')
  .map((browser) => browser.trim().toLowerCase())
  .filter(Boolean);

// Mobile emulation isn't a separate browser engine - it's a Playwright device
// profile (viewport/UA/touch) layered on top of one, same as the existing
// `npm run cucumber:mobile` script. Each DEVICES entry becomes its own
// parallel leg running MOBILE_BROWSER (default chromium) with that device.
const DEVICES = (process.env.DEVICES ?? '')
  .split(',')
  .map((device) => device.trim())
  .filter(Boolean);
const MOBILE_BROWSER = (process.env.MOBILE_BROWSER ?? 'chromium').toLowerCase();

const legs = [
  ...BROWSERS.map((browser) => ({ label: browser, browser, device: undefined })),
  ...DEVICES.map((device) => ({ label: `mobile:${device}`, browser: MOBILE_BROWSER, device })),
];

const extraArgs = process.argv.slice(2);
// `npm run cucumber:cross-browser -- --tags "@smoke"` is unreliable: npm's
// arg parser has been observed dropping everything after `--` (warning
// "Unknown cli config") depending on npm/shell combination, so provide TAGS/
// FEATURE/NAME env vars as forwarding-proof alternatives to CLI args.
if (process.env.TAGS && !extraArgs.includes('--tags') && !extraArgs.includes('-t')) {
  extraArgs.push('--tags', process.env.TAGS);
}
// FEATURE takes one or more comma-separated feature file paths, e.g.
// FEATURE="features/misc.feature" or FEATURE="features/misc.feature,features/cart.feature".
// Positional paths REPLACE cucumber's default (whole-suite) glob rather than
// merging with it, since cucumber.js no longer sets `paths` itself.
if (process.env.FEATURE) {
  extraArgs.push(...process.env.FEATURE.split(',').map((p) => p.trim()).filter(Boolean));
}
// NAME is cucumber-js's --name (scenario-title regex), e.g. NAME="TC01 "
// (trailing space matters - it excludes "TC01a - ..." which --name would
// otherwise also match, since it's substring, not exact, matching).
if (process.env.NAME && !extraArgs.includes('--name') && !extraArgs.includes('-n')) {
  extraArgs.push('--name', process.env.NAME);
}
// Deliberately no `--format progress` injection here: adding any CLI
// `--format` flag on top of cucumber.js's config-based formatters was found
// to corrupt the allure-cucumberjs formatter's writes (it silently dropped
// most of a scenario's result files). Live progress instead comes from
// support/hooks.ts's AfterStep/After/AfterAll hooks, which print directly via
// process.stdout.write and never touch Cucumber's formatter machinery.
const cucumberBin = path.join(
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'cucumber-js.cmd' : 'cucumber-js',
);

// cyan, magenta, yellow, green, blue, red - cycles if there are more browsers than colors.
const COLORS = [36, 35, 33, 32, 34, 31];

// support/hooks.ts's AfterAll hook prints a final tally line like
// "6 scenarios (6 passed, 0 failed), 54 steps (...)" - captured here so the
// end-of-run summary below can show real pass/fail counts per leg, not just
// an exit code.
const SUMMARY_LINE = /^\d+ (scenario|step|hook)s? /i;

function pipeWithPrefix(stream, label, colorCode, collected) {
  let buffered = '';
  stream.on('data', (chunk) => {
    buffered += chunk.toString();
    const lines = buffered.split('\n');
    buffered = lines.pop();
    for (const line of lines) {
      collected.push(line);
      process.stdout.write(`\x1b[${colorCode}m[${label}]\x1b[0m ${line}\n`);
    }
  });
  stream.on('end', () => {
    if (buffered) {
      collected.push(buffered);
      process.stdout.write(`\x1b[${colorCode}m[${label}]\x1b[0m ${buffered}\n`);
    }
  });
}

const runs = legs.map((leg, index) => {
  const child = spawn(cucumberBin, extraArgs, {
    // Several legs' step logs interleaved are unreadable regardless of
    // formatter, so default to quiet here; an explicit LOG_STEPS still wins.
    // DEVICE is always set explicitly (even to '') so a desktop leg never
    // inherits a DEVICE left over in the parent shell's environment.
    env: {
      ...process.env,
      BROWSER: leg.browser,
      DEVICE: leg.device ?? '',
      LOG_STEPS: process.env.LOG_STEPS ?? 'false',
    },
    shell: process.platform === 'win32',
  });
  const colorCode = COLORS[index % COLORS.length];
  const collected = [];
  pipeWithPrefix(child.stdout, leg.label, colorCode, collected);
  pipeWithPrefix(child.stderr, leg.label, colorCode, collected);
  return new Promise((resolve) => {
    child.on('close', (code) => resolve({
      label: leg.label,
      code: code ?? 1,
      summary: collected.filter((line) => SUMMARY_LINE.test(line)),
    }));
    child.on('error', (err) => {
      process.stderr.write(`[${leg.label}] failed to start: ${err.message}\n`);
      resolve({ label: leg.label, code: 1, summary: [] });
    });
  });
});

Promise.all(runs).then((results) => {
  console.log('\nCross-browser run summary:');
  let anyFailed = false;
  for (const { label, code, summary } of results) {
    console.log(`  ${label}: ${code === 0 ? 'PASSED' : `FAILED (exit ${code})`}`);
    for (const line of summary) console.log(`    ${line}`);
    if (code !== 0) anyFailed = true;
  }
  process.exit(anyFailed ? 1 : 0);
});
