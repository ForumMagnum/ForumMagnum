import { defineConfig, devices } from "@playwright/test";

type WebServers = Extract<Parameters<typeof defineConfig>[0]["webServer"], any[]>;
type Projects = Extract<Parameters<typeof defineConfig>[0]["projects"], any[]>;

const CROSSPOST_TEST_REGEX = /.*crossposts.spec.ts/
const HOCUSPOCUS_PORT = 8080;
const HOCUSPOCUS_URL = `ws://localhost:${HOCUSPOCUS_PORT}`;
const HOCUSPOCUS_JWT_SECRET = "playwright_hocuspocus_secret";
const ENABLE_HOCUSPOCUS = process.env.PLAYWRIGHT_HOCUSPOCUS === "1";
const DEFAULT_PLAYWRIGHT_DB_URL = "postgres://postgres:password@localhost:5433/postgres";
const PLAYWRIGHT_DB_URL = process.env.PG_URL ?? DEFAULT_PLAYWRIGHT_DB_URL;

const getWebServers = () => {
  const webServers: WebServers = [];

  if (!process.env.CI) {
    webServers.push({
      command: "yarn playwright-db",
      port: 5433,
      reuseExistingServer: true,
      stdout: "ignore",
      // Keep this as "pipe" so failures (often docker/port issues) are visible.
      stderr: "pipe",
    });
  }

  if (ENABLE_HOCUSPOCUS) {
    webServers.push({
      // NOTE: we assume fly/hocuspocusServer already has dependencies installed locally.
      // (It is a separate project with its own node_modules.)
      command: `cd fly/hocuspocusServer && yarn build && E2E=true PORT=${HOCUSPOCUS_PORT} DATABASE_URL=${PLAYWRIGHT_DB_URL} HOCUSPOCUS_JWT_SECRET=${HOCUSPOCUS_JWT_SECRET} node dist/index.js`,
      // Important: use an HTTP healthcheck rather than only checking that the port is open.
      // Otherwise Playwright can incorrectly treat a crashed/incorrect process as "available",
      // leading to ws://localhost:${HOCUSPOCUS_PORT} connection refused during the test.
      url: `http://localhost:${HOCUSPOCUS_PORT}/health`,
      reuseExistingServer: true,
      stdout: "pipe",
      stderr: "pipe",
    });
  }

  webServers.push({
    command: ENABLE_HOCUSPOCUS
      ? `PORT=3456 E2E=true PG_URL=${PLAYWRIGHT_DB_URL} HOCUSPOCUS_URL=${HOCUSPOCUS_URL} HOCUSPOCUS_JWT_SECRET=${HOCUSPOCUS_JWT_SECRET} yarn next dev --turbopack`
      : `PORT=3456 E2E=true PG_URL=${PLAYWRIGHT_DB_URL} yarn next dev --turbopack`,
    url: "http://localhost:3456",
    reuseExistingServer: true,
    stdout: ENABLE_HOCUSPOCUS ? "pipe" : "ignore",
    stderr: "pipe",
  });

  if (process.env.CROSSPOST_TEST) {
    if (!process.env.CI) {
      webServers.push({
        command: "yarn playwright-db-crosspost",
        port: 5434,
        reuseExistingServer: true,
        stdout: "ignore",
        stderr: "ignore",
      });
    }

    webServers.push({
      command: "yarn start-playwright-crosspost",
      url: "http://localhost:3467",
      reuseExistingServer: true,
      stdout: "ignore",
      stderr: "pipe",
    });
  }
  return webServers;
}

const getProjects = () => {
  if (process.env.CROSSPOST_TEST) {
    return [{
      name: "crosspost",
      use: {...devices["Desktop Chrome"]},
      grep: CROSSPOST_TEST_REGEX,
    }];
  }
  let projects: Projects = [
    {
      name: "chromium",
      use: {...devices["Desktop Chrome"]},
      grepInvert: CROSSPOST_TEST_REGEX,
    },
  ];
  if (process.env.CI) {
    // In CI the projects are run by name from the strategy matrix, so
    // we add all of them here to make them available.
    projects = projects.concat([
      {
        name: "firefox",
        use: {
          ...devices["Desktop Firefox"],
          launchOptions: {
            // Enable hover on Firefox Linux
            // See https://github.com/microsoft/playwright/issues/7769
            firefoxUserPrefs: {
              "ui.primaryPointerCapabilities": 0x02 | 0x04,
              "ui.allPointerCapabilities": 0x02 | 0x04,
            },
          },
        },
        grepInvert: CROSSPOST_TEST_REGEX,
      },
      {
        name: "webkit",
        use: {...devices["Desktop Safari"]},
        grepInvert: CROSSPOST_TEST_REGEX,
      },

      /* Test against mobile viewports. */
      {
        name: "mobile-chrome",
        use: {...devices["Pixel 5"]},
        grepInvert: CROSSPOST_TEST_REGEX,
      },
      {
        name: "mobile-webkit",
        use: {...devices["iPhone 12"]},
        grepInvert: CROSSPOST_TEST_REGEX,
      },

      /* Test against branded browsers. */
      {
        name: "edge",
        use: {...devices["Desktop Edge"], channel: "msedge"},
        grepInvert: CROSSPOST_TEST_REGEX,
      },
      {
        name: "chrome",
        use: {...devices["Desktop Chrome"], channel: "chrome"},
        grepInvert: CROSSPOST_TEST_REGEX,
      },
    ]);
  }
  return projects;
}

const getTimeout = () => {
  // Crossposting tests are more complex and take longer
  const base = process.env.CROSSPOST_TEST ? 60_000 : 30_000;
  // Increase timeout in CI as Github runners are very underpowered
  const multiplier = process.env.CI ? 4 : 1;
  return base * multiplier;
}

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./playwright",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['html', { open: 'never' }], ['line']],
  /* Set global test timeout */
  timeout: getTimeout(),
  /*
   * Global timeout for the entire test run. Note that we run each project in
   * a separate matrix on Github, so this timeout ends up being per project.
   */
  globalTimeout: process.env.CI ? 600_000 : undefined,
  /*
   * Shared settings for all the projects below.
   * See https://playwright.dev/docs/api/class-testoptions.
   */
  use: {
    /* Base URL to use in actions like `await page.goto("/")`. */
    baseURL: "http://localhost:3456",

    /*
     * Collect trace when retrying the failed test.
     * See https://playwright.dev/docs/trace-viewer
     */
    trace: "on-first-retry",

    /**
     * Record videos on test failure
     */
    video: "retain-on-failure",
  },
  projects: getProjects(),
  webServer: getWebServers(),
});
