import config from "./jest.config";

const base = "packages/lesswrong/integrationTests";

export default {
  ...config,
  testMatch: [
    `<rootDir>/${base}/**/?(*.)+(spec|test|tests).[tj]s?(x)`,
  ],
  setupFilesAfterEnv: [
    `<rootDir>/${base}/integrationTestSetup.ts`,
  ],
  coverageDirectory: "<rootDir>/integration-coverage/",
  maxWorkers: "50%",
  preset: "@shelf/jest-mongodb",
};
