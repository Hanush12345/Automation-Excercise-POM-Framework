import * as dotenv from 'dotenv';
import * as path from 'path';
import { getEnvProfile } from './environments';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

/** TEST_ENV selects a dummy environment profile (dev/qa). Real process env vars still win. */
const TEST_ENV = process.env.TEST_ENV;
const PROFILE = getEnvProfile(TEST_ENV);

function required(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}. Copy .env.example to .env.`);
  }
  return value;
}

export const ENV = {
  name: TEST_ENV ?? 'local',
  baseUrl: required('BASE_URL', PROFILE?.baseUrl ?? 'https://automationexercise.com'),
  blockAds: (process.env.BLOCK_ADS ?? 'true') === 'true',
  // Same env var > profile > fallback precedence playwright.config.ts uses for
  // SLOW_MO/DEFAULT_TIMEOUT. HEADLESS's bare fallback is intentionally `false`
  // (not Playwright's `true`) so `cucumber-js features/x.feature` runs headed
  // by default with no HEADLESS/BROWSER flags needed on the command line; this
  // only affects the cucumber (BDD) runner - playwright.config.ts resolves its
  // own HEADLESS separately and still defaults to headless `true`.
  headless: process.env.HEADLESS !== undefined ? process.env.HEADLESS !== 'false' : (PROFILE?.headless ?? false),
  slowMo: process.env.SLOW_MO !== undefined ? Number(process.env.SLOW_MO) : (PROFILE?.slowMo ?? 1000),
  defaultTimeout: Number(process.env.DEFAULT_TIMEOUT ?? PROFILE?.defaultTimeout ?? 180_000),
  existingUser: {
    name: required('EXISTING_USER_NAME', PROFILE?.existingUser.name ?? 'QA Automation User'),
    email: required('EXISTING_USER_EMAIL', PROFILE?.existingUser.email ?? 'qa.automation.user@example.com'),
    password: required('EXISTING_USER_PASSWORD', PROFILE?.existingUser.password ?? 'Passw0rd!123'),
  },
} as const;

/** Ad, analytics and consent domains that make this site flaky if left unblocked. */
export const BLOCKED_RESOURCE_PATTERNS: RegExp[] = [
  /googlesyndication\.com/,
  /doubleclick\.net/,
  /googleadservices\.com/,
  /google-analytics\.com/,
  /googletagmanager\.com/,
  /adservice\.google\./,
  /pagead2\./,
  /fundingchoicesmessages\.google\.com/,
  /ezoic\.net/,
  /pubmatic\.com/,
  /amazon-adsystem\.com/,
];
