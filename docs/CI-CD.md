# CI/CD Setup

Two pipelines run the same suite and are kept deliberately in sync:

| | Jenkins | GitHub Actions |
|---|---|---|
| Definition | [`Jenkinsfile`](../Jenkinsfile) | [`.github/workflows/cucumber.yml`](../.github/workflows/cucumber.yml) |
| Browsers | chromium, firefox, webkit (parallel) | chromium, firefox, webkit (matrix) |
| Quality gate | typecheck + lint | typecheck + lint |
| Nightly | 01:30 via `cron` | 01:30 UTC via `schedule` |
| Reports | Allure (with trend history), JUnit, archived HTML | Artifacts per browser |

Keeping both is optional. If Jenkins becomes the system of record, the Actions
workflow is still useful as a fast pre-merge gate on pull requests — see
[Branch protection](#branch-protection) below.

---

## Jenkins

### 1. Required plugins

Install from **Manage Jenkins → Plugins**:

| Plugin | Why |
|---|---|
| Pipeline | Declarative pipeline support |
| Docker Pipeline | The `agent { docker { ... } }` block |
| Git / GitHub Branch Source | Checkout, and multibranch discovery |
| JUnit | `junit` step — test trends |
| Allure | `allure` step — merged report with history |
| Email Extension | `emailext` — failure notifications |
| Credentials Binding | `withCredentials` |
| Timestamper | `timestamps()` option |
| Workspace Cleanup | `cleanWs()` |

### 2. Configure the Allure tool

**Manage Jenkins → Tools → Allure Commandline → Add**, name it `allure`,
install automatically from Maven Central. Without this the `allure` step in the
`post` block fails.

### 3. Add credentials

The suite needs a pre-registered account on the target site. Without these,
[`src/config/env.ts`](../src/config/env.ts) silently falls back to placeholder
defaults that are **not** a real account, and the login/checkout scenarios fail.

**Manage Jenkins → Credentials → System → Global → Add Credentials:**

| ID | Kind | Fields |
|---|---|---|
| `automationexercise-test-user` | Username with password | Username = the account email, Password = the account password |
| `automationexercise-test-user-name` | Secret text | The account display name |

These IDs are referenced by name in the `Jenkinsfile`. Change one, change both.

> Create the account by running `npx cucumber-js --tags @auth` once locally, or
> register manually on the site. Never commit these values — `.env` is
> gitignored precisely so they stay out of the repository.

### 4. Create the job

**New Item → Multibranch Pipeline** (recommended — builds every branch and PR):

- **Branch Sources → GitHub** → add your repo URL
- Credentials: a GitHub personal access token with `repo` scope
- **Build Configuration → by Jenkinsfile**, script path `Jenkinsfile`
- **Scan Repository Triggers** → periodically, e.g. every 15 minutes

For a single branch instead, use **Pipeline → Pipeline script from SCM**.

### 5. Agent requirements

The agent needs Docker available to the Jenkins user. The pipeline pulls
`mcr.microsoft.com/playwright:v1.62.1-noble`, which ships the browsers and their
system libraries preinstalled.

> **Keep the image tag in step with `package-lock.json`.** Playwright refuses to
> launch when the driver version and the bundled browser build differ. The lock
> currently resolves `playwright-core` to **1.62.1**. When you bump Playwright,
> bump the tag in the `Jenkinsfile` in the same commit.

If Docker is unavailable, drop the `agent { docker { ... } }` block to
`agent any` and add `sh 'npx playwright install --with-deps'` after `npm ci`.
That needs root on the agent for the `--with-deps` apt step.

### 6. Running it

The **Build with Parameters** button exposes:

| Parameter | Default | Notes |
|---|---|---|
| `BROWSERS` | `chromium,firefox,webkit` | Comma-separated; becomes one parallel stage each |
| `TAGS` | *(blank)* | Cucumber tag expression, e.g. `@smoke`, `@cart and not @wip`. Blank runs everything |
| `TEST_ENV` | `qa` | Profile from `src/config/environments.ts`; also namespaces reports under `reports/<env>/` |
| `RETRIES` | `2` | Per-scenario retries, to absorb demo-site flakiness |
| `WORKERS` | `2` | Parallel cucumber workers per browser |
| `RUN_QUALITY` | `true` | Skip to go straight to the suite |

### Build result semantics

The distinction matters when you wire up alerting:

- **UNSTABLE** — scenarios failed. Other browsers still run to completion and
  reports are published. This is the expected outcome of a genuine test failure.
- **FAILURE** — the pipeline broke *outside* the tests: install, typecheck,
  lint, or infrastructure. This is what triggers the `emailext` notification,
  so alerts mean "the pipeline is broken", not "a test failed".

`fixed` sends a recovery email on the first green build after a failure.

---

## Branch protection

Applied on GitHub, not from this repo — **Settings → Branches → Add rule** for
`main`:

- ☑ Require a pull request before merging
- ☑ Require status checks to pass before merging
  - Select `quality` (fast: typecheck + lint, no browsers)
  - Optionally `test (chromium)` — but see the caveat below
- ☑ Require branches to be up to date before merging

> **Be cautious about making the browser jobs required.** They run against the
> live public `automationexercise.com`, so an outage or slowdown on a
> third-party site would block all merges. The `quality` gate is deterministic
> and safe to require; the browser suite is better treated as advisory, or
> restricted to `@smoke` on a single browser.

To add a Jenkins build as a required check, install the GitHub Checks plugin
and configure the GitHub Branch Source to report statuses back.

---

## Troubleshooting

**"Cucumber can only run on Node.js versions 22 || 24 || >=26"** — the agent's
Node is too old. `@cucumber/cucumber` 13.x hard-exits before running a single
scenario, so the job fails in seconds and the output looks like a crash rather
than a version problem. `package.json` declares `engines.node >= 22`, the
Actions workflow pins `node-version: 22`, and the `Install` stage here checks
the version explicitly. **The Playwright image's bundled Node version can
change between releases**, so this can regress from a routine image-tag bump —
which is exactly why the guard fails loudly instead of letting the suite start.

**Chromium crashes mid-run, or "Target closed"** — the `--ipc=host` arg is
missing. Chromium exhausts Docker's default 64MB `/dev/shm`.

**"Executable doesn't exist at /ms-playwright/..."** — image tag and
`package-lock.json` version have drifted apart. See step 5.

**`EACCES` during `npm ci`** — the `-u root:root` arg was removed. The image's
`pwuser` cannot write to a Jenkins-owned workspace.

**Allure report empty** — the Allure tool is not configured (step 2), or the
run set `TEST_ENV`, which moves results to `allure-results/<env>/`. The
`results: [[path: 'allure-results']]` entry covers both, since the plugin
recurses.

**Login/checkout scenarios fail everywhere** — credentials missing or wrong, so
`env.ts` fell back to its non-existent placeholder account. See step 3.
