// Jenkins declarative pipeline for the Cucumber + Playwright POM framework.
//
// Mirrors .github/workflows/cucumber.yml (same quality gate, same
// cross-browser matrix, same report paths) so the two stay interchangeable -
// see docs/CI-CD.md for one-time Jenkins setup (plugins, credentials, job).
//
// Runs inside Microsoft's official Playwright image so the browsers and their
// system dependencies are already baked in: no `playwright install --with-deps`
// step, no apt packages, and no root access needed on the Jenkins agent itself.

pipeline {
  // The image tag MUST match the playwright version resolved in
  // package-lock.json (currently 1.62.1). Playwright refuses to launch when the
  // driver and the bundled browser build differ, so bump both together.
  agent {
    docker {
      image 'mcr.microsoft.com/playwright:v1.62.1-noble'
      // --ipc=host: Chromium exhausts the default 64MB /dev/shm and crashes
      // mid-run otherwise. This is Playwright's own documented recommendation.
      // -u root: the image's pwuser cannot write to a Jenkins-owned workspace.
      args '--ipc=host -u root:root'
    }
  }

  parameters {
    choice(
      name: 'BROWSERS',
      choices: ['chromium,firefox,webkit', 'chromium', 'firefox', 'webkit', 'chromium,firefox'],
      description: 'Which browsers to run, as parallel stages.'
    )
    string(
      name: 'TAGS',
      defaultValue: '',
      description: 'Cucumber tag expression, e.g. "@smoke" or "@cart and not @wip". Leave blank to run every scenario.'
    )
    choice(
      name: 'TEST_ENV',
      choices: ['qa', 'dev'],
      description: 'Environment profile from src/config/environments.ts. Also namespaces reports under reports/<env>/.'
    )
    string(
      name: 'RETRIES',
      defaultValue: '2',
      description: 'Per-scenario retries. Absorbs flakiness from the live demo site.'
    )
    string(
      name: 'WORKERS',
      defaultValue: '2',
      description: 'Parallel cucumber-js workers per browser. Raise only if the agent has spare CPU.'
    )
    booleanParam(
      name: 'RUN_QUALITY',
      defaultValue: true,
      description: 'Run the typecheck + lint gate before the suite.'
    )
  }

  options {
    timeout(time: 90, unit: 'MINUTES')
    // Keep enough history for Allure's trend graphs without unbounded disk use.
    buildDiscarder(logRotator(numToKeepStr: '30', artifactNumToKeepStr: '10'))
    timestamps()
    // The suite drives a shared external site and a shared test account, so
    // overlapping builds would interfere with each other.
    disableConcurrentBuilds()
    skipDefaultCheckout(false)
  }

  triggers {
    // Nightly regression at 01:30, matching the GitHub Actions schedule.
    cron('30 1 * * *')
  }

  environment {
    // CI=true makes cucumber.js switch to its CI defaults; RETRIES/WORKERS
    // below still take precedence over them.
    CI = 'true'
    HEADLESS = 'true'
    BASE_URL = 'https://automationexercise.com'
    TEST_ENV = "${params.TEST_ENV}"
    RETRIES = "${params.RETRIES}"
    WORKERS = "${params.WORKERS}"
    // Keeps npm's cache inside the workspace so the root-owned container does
    // not write into the Jenkins user's home directory.
    npm_config_cache = "${WORKSPACE}/.npm-cache"
  }

  stages {
    stage('Install') {
      steps {
        // Wipe results from any previous build in this workspace. Without this,
        // the post block's globs would re-publish stale junit/allure files for
        // browsers that this build did not actually run.
        sh 'rm -rf reports allure-results test-results'

        // @cucumber/cucumber 13.x declares engines "22 || 24 || >=26" and
        // hard-exits on anything older, with no scenarios run. Fail here with a
        // clear message instead of 40 lines into the suite: the Playwright
        // image's bundled Node version changes between releases, so this can
        // regress purely from bumping the image tag.
        sh '''
          NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
          echo "node $(node --version) / npm $(npm --version)"
          if [ "$NODE_MAJOR" -lt 22 ]; then
            echo "ERROR: cucumber requires Node 22+, image provides $(node --version)."
            echo "Either use a Playwright image built on Node 22+, or install it in this stage."
            exit 1
          fi
        '''

        // --ignore-scripts skips the postinstall hook, which would download all
        // four browsers (including msedge, which has no Linux build). The
        // Playwright image already ships the three we test.
        sh 'npm ci --ignore-scripts'
        sh 'npx playwright --version'
      }
    }

    stage('Quality') {
      when { expression { return params.RUN_QUALITY } }
      steps {
        sh 'npm run typecheck'
        sh 'npm run lint'
      }
    }

    stage('Test') {
      steps {
        script {
          // Build one parallel branch per selected browser. Each writes to its
          // own reports/<env>/cucumber/<browser>/ tree, so they never collide;
          // allure results are uuid-named and safe to share a directory.
          def browsers = params.BROWSERS.split(',').collect { it.trim() }.findAll { it }
          def tagArgs = params.TAGS?.trim() ? "--tags '${params.TAGS.trim()}'" : ''

          parallel browsers.collectEntries { browser ->
            ["${browser}": {
              stage(browser) {
                // The suite is expected to produce failures against a live
                // third-party site; record them and let the post block publish
                // reports rather than aborting the other browsers.
                catchError(buildResult: 'UNSTABLE', stageResult: 'FAILURE') {
                  withCredentials([
                    usernamePassword(
                      credentialsId: 'automationexercise-test-user',
                      usernameVariable: 'EXISTING_USER_EMAIL',
                      passwordVariable: 'EXISTING_USER_PASSWORD'
                    ),
                    string(
                      credentialsId: 'automationexercise-test-user-name',
                      variable: 'EXISTING_USER_NAME'
                    )
                  ]) {
                    sh "BROWSER=${browser} npx cucumber-js ${tagArgs}"
                  }
                }
              }
            }]
          }
        }
      }
    }
  }

  post {
    always {
      // Report dirs are namespaced by TEST_ENV, so glob rather than hard-code.
      junit testResults: 'reports/**/cucumber/**/junit/results.xml',
            allowEmptyResults: true,
            skipPublishingChecks: true

      archiveArtifacts artifacts: 'reports/**/cucumber/**/html/report.html, reports/**/cucumber/**/json/results.json',
                       allowEmptyArchive: true,
                       fingerprint: false

      // Requires the Allure Jenkins plugin plus an "allure" tool configured.
      // Merges every browser's results into one report with trend history.
      //
      // The path must be the exact results dir: `allure generate` does not
      // recurse, and cucumber.js namespaces its output by TEST_ENV
      // (allure-results/<env>/cucumber). Pointing at `allure-results` produces
      // a report with zero test cases.
      allure includeProperties: false,
             jdk: '',
             results: [[path: "allure-results/${params.TEST_ENV}/cucumber"]]

      // Screenshots/videos are attached inline to the cucumber HTML report by
      // support/hooks.ts, so only the raw trace/video scratch dir is kept here.
      archiveArtifacts artifacts: 'test-results/**', allowEmptyArchive: true

      cleanWs(
        deleteDirs: true,
        notFailBuild: true,
        patterns: [[pattern: '.npm-cache/**', type: 'INCLUDE']]
      )
    }

    unstable {
      echo "Suite completed with test failures - see the Allure report for the breakdown."
    }

    failure {
      // Pipeline-level failure (install/typecheck/lint/infra), distinct from
      // test failures, which surface as UNSTABLE above.
      emailext(
        subject: "FAILED: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
        body: """<p>The pipeline failed before or outside the test run.</p>
                 <p><a href="${env.BUILD_URL}">Build #${env.BUILD_NUMBER}</a> on branch <b>${env.BRANCH_NAME ?: 'n/a'}</b></p>
                 <p>Console: <a href="${env.BUILD_URL}console">output</a></p>""",
        mimeType: 'text/html',
        to: '$DEFAULT_RECIPIENTS',
        recipientProviders: [developers(), requestor()]
      )
    }

    fixed {
      emailext(
        subject: "FIXED: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
        body: """<p>Back to green: <a href="${env.BUILD_URL}">build #${env.BUILD_NUMBER}</a>.</p>""",
        mimeType: 'text/html',
        to: '$DEFAULT_RECIPIENTS',
        recipientProviders: [developers(), requestor()]
      )
    }
  }
}
