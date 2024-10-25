import config, { IGNORE_PATHS } from "./jest.config";

const dir = "/elasticTests";
const base = `packages/lesswrong${dir}`;

export default {
  ...config,
  testMatch: [
    `<rootDir>/${base}/**/?(*.)+(spec|test|tests).[tj]s?(x)`,
  ],
  // setupFiles: [
  //   `<rootDir>/${base}/testPreSetup.ts`,
  // ],
  coverageDirectory: "<rootDir>/elastic-coverage/",
  coveragePathIgnorePatterns: [
    ...config.coveragePathIgnorePatterns,
    ...IGNORE_PATHS.filter(p => !p.startsWith(dir)),
  ],
};
