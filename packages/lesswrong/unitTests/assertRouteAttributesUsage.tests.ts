import fs from "fs";
import path from "path";

const APP_DIRECTORY = path.join(process.cwd(), "app");
const PAGE_FILENAME = "page.tsx";
const ASSERT_ROUTE_ATTRIBUTES_CALL_REGEX = /\bassertRouteAttributes\s*\(/;

function collectPageFilesRecursively(directoryPath: string): string[] {
  const entries = fs.readdirSync(directoryPath, { withFileTypes: true });
  const pageFiles: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      pageFiles.push(...collectPageFilesRecursively(fullPath));
      continue;
    }
    if (entry.isFile() && entry.name === PAGE_FILENAME) {
      pageFiles.push(fullPath);
    }
  }

  return pageFiles;
}

function getMissingAssertRouteAttributesPages(): string[] {
  const pageFiles = collectPageFilesRecursively(APP_DIRECTORY);
  return pageFiles
    .filter((pageFilePath) => {
      const fileContents = fs.readFileSync(pageFilePath, "utf8");
      return !ASSERT_ROUTE_ATTRIBUTES_CALL_REGEX.test(fileContents);
    })
    .map((pageFilePath) => path.relative(process.cwd(), pageFilePath).replaceAll(path.sep, "/"))
    .sort();
}

describe("app route attribute assertions", () => {
  it("requires every page.tsx route to call assertRouteAttributes", () => {
    const missingPages = getMissingAssertRouteAttributesPages();
    if (missingPages.length > 0) {
      throw new Error(
        [
          "The following app page routes are missing assertRouteAttributes(...) calls:",
          ...missingPages.map((missingPage) => ` - ${missingPage}`),
        ].join("\n")
      );
    }
  });
});
