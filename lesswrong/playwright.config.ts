import { defineConfig, devices } from "@playwright/test";

type WebServers = Extract<Parameters<typeof defineConfig>[0]["webServer"], any[]>;
type Projects = Extract<Parameters<typeof defineConfig>[0]["projects"], any[]>;

const CROSSPOST_TEST_REGEX = "**/crossposts.spec.ts";

const getWebServers = () => {
  const webServers: WebServers = [];

  if (!process.env.CI) {
    webServers.push({
      command: "yarn playwright-db",
      port: 5433,
      reuseExistingServer: true,
      stdout: "ignore",
      stderr: "ignore",
    });
  }

  webServers.push({
    command: "yarn start-playwright",
    url: "http://localhost:3456",
    reuseExistingServer: true,
    stdout: "ignore",
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
      testMatch: CROSSPOST_TEST_REGEX,
    }];
  }
  let projects: Projects = [
    {
      name: "chromium",
      use: {...devices["Desktop Chrome"]},
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
      },
      {
        name: "webkit",
        use: {...devices["Desktop Safari"]},
      },

      /* Test against mobile viewports. */
      {
        name: "mobile-chrome",
        use: {...devices["Pixel 5"]},
      },
      {
        name: "mobile-webkit",
        use: {...devices["iPhone 12"]},
      },

      /* Test against branded browsers. */
      {
        name: "edge",
        use: {...devices["Desktop Edge"], channel: "msedge"},
      },
      {
        name: "chrome",
        use: {...devices["Desktop Chrome"], channel: "chrome"},
      },
    ]);
  }
  return projects;
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
  /* Increase timeout in CI as Github runners are very underpowered */
  timeout: process.env.CI ? 60_000 : 30_000,
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
  testIgnore: process.env.CROSSPOST_TEST ? "" : CROSSPOST_TEST_REGEX,
});
