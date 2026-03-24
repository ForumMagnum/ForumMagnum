import fs from "fs";
import path from "path";

const APP_DIRECTORY = path.join(process.cwd(), "app");
const PAGE_FILENAME = "page.tsx";
const ASSERT_ROUTE_ATTRIBUTES_CALL_REGEX = /\bassertRouteAttributes\s*\(/;
const EXPORT_GENERATE_METADATA_REGEX =
  /\bexport\s+(?:(?:async\s+)?function\s+generateMetadata\s*\(|const\s+generateMetadata\s*=)/;

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

function getMissingGenerateMetadataPages(): string[] {
  const pageFiles = collectPageFilesRecursively(APP_DIRECTORY);
  return pageFiles
    .filter((pageFilePath) => {
      const fileContents = fs.readFileSync(pageFilePath, "utf8");
      return !EXPORT_GENERATE_METADATA_REGEX.test(fileContents);
    })
    .map((pageFilePath) => path.relative(process.cwd(), pageFilePath).replaceAll(path.sep, "/"))
    .sort();
}

describe("app routes", () => {
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

  it("requires every page.tsx route to export generateMetadata", () => {
    const missingPages = getMissingGenerateMetadataPages();
    if (missingPages.length > 0) {
      throw new Error(
        [
          "The following app page routes are missing exported generateMetadata functions:",
          ...missingPages.map((missingPage) => ` - ${missingPage}`),
        ].join("\n")
      );
    }
  });
});
