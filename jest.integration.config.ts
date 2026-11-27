import config from "./jest.config";

const base = "packages/lesswrong/integrationTests";

export default async () => ({
  ...(await config()),
  testMatch: [
    `<rootDir>/${base}/**/?(*.)+(spec|test|tests).[tj]s?(x)`,
  ],
  globalSetup: `<rootDir>/${base}/globalSetup.ts`,
  globalTeardown: `<rootDir>/${base}/globalTeardown.ts`,
  setupFiles: [
    `<rootDir>/${base}/testPreSetup.ts`,
  ],
  // Each worker holds up to about nine database connections; see POSTGRES_MAX_CONNECTIONS in minipgDatabase.ts.
  maxWorkers: 3,
  coverageDirectory: "<rootDir>/integration-coverage/",
  coveragePathIgnorePatterns: [
    ...(await config()).coveragePathIgnorePatterns ?? [],
    "/unitTests/",
  ],
  globals: {
    ...(await config()).globals ?? {},
    bundleIsIntegrationTest: true,
  },
});
