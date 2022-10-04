import config from "./jest.config";

export default {
  ...config,
  rootDir: "packages/lesswrong/integrationTests",
  setupFilesAfterEnv: [
    "<rootDir>/integrationTestSetup.ts",
  ],
  maxWorkers: "50%",
  preset: "@shelf/jest-mongodb",
};
