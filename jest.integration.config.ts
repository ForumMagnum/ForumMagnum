import config from "./jest.config";

const base = "packages/lesswrong/integrationTests";

export default {
  ...config,
  testMatch: [
    `<rootDir>/${base}/**/?(*.)+(spec|test|tests).[tj]s?(x)`,
  ],
  setupFiles: [
    `<rootDir>/${base}/testPreSetup.ts`,
  ],
  coverageDirectory: "<rootDir>/integration-coverage/",
  coveragePathIgnorePatterns: [
    ...config.coveragePathIgnorePatterns,
    "/unitTests/",
  ],
  preset: "@shelf/jest-mongodb",
};
