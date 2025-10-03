import config from "./jest.config";

const base = "packages/lesswrong/unitTests";

export default async () => ({
  ...(await config()),
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
    ...(await config()).coveragePathIgnorePatterns ?? [],
    "/integrationTests/",
  ],
});
