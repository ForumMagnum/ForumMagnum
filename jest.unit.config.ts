import config from "./jest.config";

const base = "packages/lesswrong/unitTests";

export default {
  ...config,
  testMatch: [
    `<rootDir>/${base}/**/?(*.)+(spec|test|tests).[tj]s?(x)`,
  ],
  setupFilesAfterEnv: [
    `<rootDir>/${base}/unitTestSetup.ts`,
  ],
  coverageDirectory: "<rootDir>/unit-coverage/",
};
