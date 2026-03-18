import fs from "node:fs";
import path from "node:path";
import { globSync } from "glob";

interface FragmentInfo {
  definitionLine: number | null;
  definitionPath: string | null;
  name: string;
  usageCount: number;
}

const FRAGMENT_TYPES_PATH = "packages/lesswrong/lib/generated/fragmentTypes.d.ts";

const SOURCE_GLOBS = [
  "app/**/*.{ts,tsx,js,jsx,graphql,gql}",
  "packages/**/*.{ts,tsx,js,jsx,graphql,gql}",
];

const EXCLUDED_PATH_FRAGMENTS = [
  "node_modules/",
  "packages/lesswrong/lib/generated/",
  "packages/lesswrong/lib/vendor/",
  "packages/lesswrong/stubs/",
];

const FRAGMENT_DEFINITION_REGEX = /\bfragment\s+([A-Za-z_][A-Za-z0-9_]*)\s+on\b/g;
const FRAGMENT_SPREAD_REGEX = /\.\.\.([A-Za-z_][A-Za-z0-9_]*)\b/g;

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

function shouldScanFile(filePath: string): boolean {
  const normalizedPath = normalizePath(filePath);
  return !EXCLUDED_PATH_FRAGMENTS.some((fragment) => normalizedPath.includes(fragment));
}

function fileMatchesFilters(filePath: string, filters: string[]): boolean {
  if (filters.length === 0) {
    return true;
  }

  const normalizedPath = normalizePath(filePath);
  return filters.some((filter) => normalizedPath.includes(normalizePath(filter)));
}

function getAllSourceFiles(filters: string[]): string[] {
  const allFiles = SOURCE_GLOBS.flatMap((pattern) => globSync(pattern, { nodir: true }));
  const seenFiles = new Set<string>();

  return allFiles
    .map((filePath) => path.resolve(filePath))
    .filter((filePath) => {
      if (seenFiles.has(filePath)) {
        return false;
      }
      seenFiles.add(filePath);

      return shouldScanFile(filePath) && fileMatchesFilters(filePath, filters);
    });
}

function getLineNumber(source: string, index: number): number {
  let lineNumber = 1;
  for (let i = 0; i < index; i++) {
    if (source.charCodeAt(i) === 10) {
      lineNumber++;
    }
  }
  return lineNumber;
}

function getFragmentNames(): string[] {
  const fragmentTypesContents = fs.readFileSync(FRAGMENT_TYPES_PATH, "utf8");
  const lines = fragmentTypesContents.split("\n");
  const fragmentNames: string[] = [];
  let inFragmentTypesInterface = false;

  for (const line of lines) {
    if (!inFragmentTypesInterface) {
      if (line.includes("interface FragmentTypes")) {
        inFragmentTypesInterface = true;
      }
      continue;
    }

    if (line.trim() === "}") {
      break;
    }

    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*:/);
    if (match) {
      fragmentNames.push(match[1]);
    }
  }

  return fragmentNames;
}

function buildFragmentInfo(fragmentNames: string[]): Map<string, FragmentInfo> {
  return new Map(
    fragmentNames.map((name) => [
      name,
      {
        definitionLine: null,
        definitionPath: null,
        name,
        usageCount: 0,
      },
    ]),
  );
}

function recordFragmentDefinitions(fragmentInfoByName: Map<string, FragmentInfo>, filePath: string, source: string) {
  for (const match of source.matchAll(FRAGMENT_DEFINITION_REGEX)) {
    const [, fragmentName] = match;
    const fragmentInfo = fragmentInfoByName.get(fragmentName);
    if (!fragmentInfo || fragmentInfo.definitionPath) {
      continue;
    }

    fragmentInfo.definitionPath = filePath;
    fragmentInfo.definitionLine = getLineNumber(source, match.index ?? 0);
  }
}

function recordFragmentUsages(fragmentInfoByName: Map<string, FragmentInfo>, source: string) {
  for (const match of source.matchAll(FRAGMENT_SPREAD_REGEX)) {
    const [, fragmentName] = match;
    const fragmentInfo = fragmentInfoByName.get(fragmentName);
    if (!fragmentInfo) {
      continue;
    }

    fragmentInfo.usageCount += 1;
  }
}

function formatCandidate(fragmentInfo: FragmentInfo): string {
  const definitionPath = fragmentInfo.definitionPath ?? path.resolve(FRAGMENT_TYPES_PATH);
  const definitionLine = fragmentInfo.definitionLine ?? 1;
  return `link\`${definitionPath}:${definitionLine} ${fragmentInfo.name}\``;
}

function main() {
  const filters = process.argv.slice(2);
  const fragmentNames = getFragmentNames();
  const fragmentInfoByName = buildFragmentInfo(fragmentNames);

  for (const filePath of getAllSourceFiles(filters)) {
    const source = fs.readFileSync(filePath, "utf8");
    recordFragmentDefinitions(fragmentInfoByName, filePath, source);
    recordFragmentUsages(fragmentInfoByName, source);
  }

  const candidates = [...fragmentInfoByName.values()]
    .filter((fragmentInfo) => fragmentInfo.definitionPath && fragmentInfo.usageCount === 0)
    .sort((left, right) => {
      const pathComparison = (left.definitionPath ?? "").localeCompare(right.definitionPath ?? "");
      if (pathComparison !== 0) {
        return pathComparison;
      }

      const lineComparison = (left.definitionLine ?? 0) - (right.definitionLine ?? 0);
      if (lineComparison !== 0) {
        return lineComparison;
      }

      return left.name.localeCompare(right.name);
    });

  for (const candidate of candidates) {
    console.log(formatCandidate(candidate));
  }
}

main();
