import { randomId } from "../random";
import { getMarkdownItNoPlugins } from "../utils/markdownItPlugins";

// This currently only supports our limited subset of semVer
export function parseSemver(semver: string) {
  return semver.split(".").map((n) => parseInt(n, 10))
}

export function extractVersionsFromSemver(semver: string | null) {
  semver = semver || "1.0.0"
  const [major, minor, patch] = parseSemver(semver);
  return { major, minor, patch }
}

export function compareVersionNumbers(a: string, b: string): number {
  const [majorA,minorA,patchA] = parseSemver(a);
  const [majorB,minorB,patchB] = parseSemver(b);
  
  if (majorA>majorB) return 1;
  if (majorA<majorB) return -1;
  if (minorA>minorB) return 1;
  if (minorA<minorB) return -1;
  if (patchA>patchB) return 1;
  if (patchA<patchB) return -1;
  return 0;
}

export function markdownToHtmlSimple(markdown: string): string {
  const id = randomId()
  return getMarkdownItNoPlugins().render(markdown, {docId: id})
}
