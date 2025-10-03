import config from "./jest.config";

const base = "packages/lesswrong/integrationTests";

export default async () => ({
  ...(await config()),
  testMatch: [
    `<rootDir>/${base}/**/?(*.)+(spec|test|tests).[tj]s?(x)`,
  ],
  setupFiles: [
    `<rootDir>/${base}/testPreSetup.ts`,
  ],
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
