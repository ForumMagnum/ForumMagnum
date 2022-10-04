import config from "./jest.config";

export default {
  ...config,
  rootDir: "packages/lesswrong/unitTests",
  setupFilesAfterEnv: [
    "<rootDir>/unitTestSetup.ts",
  ],
};
