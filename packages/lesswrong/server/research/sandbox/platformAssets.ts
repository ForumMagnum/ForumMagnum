import * as fs from "node:fs";
import * as path from "node:path";

const SANDBOX_REL_DIR = "packages/lesswrong/server/research/sandbox";

function assetPath(...segments: string[]): string {
  return path.join(process.cwd(), SANDBOX_REL_DIR, ...segments);
}

export interface PlatformAssets {
  supervisorBundle: Buffer;
  researchTool: Buffer;
  claudeMd: Buffer;
}

let cached: PlatformAssets | null = null;

export function getPlatformAssets(): PlatformAssets {
  if (cached) return cached;
  const supervisorPath = assetPath("dist", "supervisor.js");
  const researchToolPath = assetPath("dist", "research-tool.cjs");
  const claudeMdPath = assetPath("supervisor", "agentInstructions.md");
  for (const p of [supervisorPath, researchToolPath, claudeMdPath]) {
    if (!fs.existsSync(p)) {
      throw new Error(
        `[platformAssets] missing platform asset at ${p}. ` +
          `Run \`yarn research-supervisor-build\` to produce the supervisor bundle.`,
      );
    }
  }
  cached = {
    supervisorBundle: fs.readFileSync(supervisorPath),
    researchTool: fs.readFileSync(researchToolPath),
    claudeMd: fs.readFileSync(claudeMdPath),
  };
  return cached;
}
