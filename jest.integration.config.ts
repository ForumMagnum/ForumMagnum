import config from "./jest.config";

const base = "packages/lesswrong/integrationTests";

export default {
  ...config,
  testMatch: [
    `<rootDir>/${base}/**/?(*.)+(spec|test|tests).[tj]s?(x)`,
  ],
  coverageDirectory: "<rootDir>/integration-coverage/",
  coveragePathIgnorePatterns: [
    ...config.coveragePathIgnorePatterns,
    "/unitTests/",
  ],
  preset: "@shelf/jest-mongodb",
};
