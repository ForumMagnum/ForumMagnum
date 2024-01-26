import config from "./jest.config";

const base = "packages/lesswrong/unitTests";

export default {
  ...config,
  testMatch: [
    `<rootDir>/${base}/**/?(*.)+(spec|test|tests).[tj]s?(x)`,
  ],
  setupFiles: [
    `<rootDir>/${base}/testPreSetup.ts`,
  ],
  setupFilesAfterEnv: [
    `<rootDir>/${base}/testSetup.ts`,
  ],
  coverageDirectory: "<rootDir>/unit-coverage/",
  coveragePathIgnorePatterns: [
    ...config.coveragePathIgnorePatterns,
    "/integrationTests/",
  ],
};
