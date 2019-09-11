
// This currently only supports our limited subset of semVer
export function extractVersionsFromSemver(semver) {
  semver = semver || "1.0.0"
  const [major, minor, patch] = semver.split(".").map((n) => parseInt(n, 10))
  return { major, minor, patch }
}
