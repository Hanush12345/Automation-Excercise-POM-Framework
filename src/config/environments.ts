/**
 * Dummy environment profiles for demo/exercise purposes.
 *
 * automationexercise.com only exists as a single public instance, so every
 * profile points at the same BASE_URL — "Dev" and "QA" differ only in
 * runtime behavior (headless mode, speed, retries, parallelism), the way a
 * real Dev vs QA test config typically would.
 *
 * Select a profile with TEST_ENV=dev|qa (see package.json test:dev/test:qa).
 * Any matching process.env var still wins over the profile default.
 */
export interface EnvProfile {
  baseUrl: string;
  headless: boolean;
  slowMo: number;
  defaultTimeout: number;
  retries: number;
  workers: number;
  existingUser: {
    name: string;
    email: string;
    password: string;
  };
}

export const ENV_PROFILES: Record<string, EnvProfile> = {
  dev: {
    baseUrl: 'https://automationexercise.com',
    headless: false,
    slowMo: 1000,
    defaultTimeout: 200_000,
    retries: 1,
    workers: 1,
    existingUser: {
      name: 'Dev QA User',
      email: 'dev.qa.user@example.com',
      password: 'Passw0rd!123',
    },
  },
  qa: {
    baseUrl: 'https://automationexercise.com',
    headless: false,
    slowMo: 1000,
    defaultTimeout: 200_000,
    retries: 1,
    workers: 1,
    existingUser: {
      name: 'QA Automation User',
      email: 'qa.automation.user@example.com',
      password: 'Passw0rd!123',
    },
  },
};

export function getEnvProfile(testEnv: string | undefined): EnvProfile | undefined {
  if (!testEnv) return undefined;
  const profile = ENV_PROFILES[testEnv];
  if (!profile) {
    throw new Error(`Unknown TEST_ENV "${testEnv}". Known profiles: ${Object.keys(ENV_PROFILES).join(', ')}`);
  }
  return profile;
}
