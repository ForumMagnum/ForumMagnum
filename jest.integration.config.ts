import config from "./jest.config";

export default {
  ...config,
  rootDir: "packages/lesswrong/integrationTests",
  maxWorkers: "50%",
  preset: "@shelf/jest-mongodb",
};
