import * as fs from "fs";
import * as path from "path";
import * as esbuild from "esbuild";

const SANDBOX_DIR = path.resolve(__dirname, "../research/sandbox");
const SUPERVISOR_DIR = path.join(SANDBOX_DIR, "supervisor");
const SUPERVISOR_ENTRY = path.join(SUPERVISOR_DIR, "index.ts");
const RESEARCH_TOOL_SOURCE = path.join(SUPERVISOR_DIR, "researchTool/researchTool.cjs");
const DIST_DIR = path.join(SANDBOX_DIR, "dist");
const SUPERVISOR_OUT = path.join(DIST_DIR, "supervisor.js");
const RESEARCH_TOOL_OUT = path.join(DIST_DIR, "research-tool.cjs");

/**
 * Build-time bundler for the in-sandbox supervisor.
 *
 * Outputs a single CommonJS file to `packages/lesswrong/server/research/sandbox/dist/`
 * that runs in the sandbox's vanilla `node24` runtime with zero npm dependencies.
 *
 * Intended usage:
 *   yarn repl dev lw packages/lesswrong/server/scripts/buildResearchSupervisor.ts
 *
 * The output bundle is uploaded into the sandbox snapshot by
 * `buildResearchSandboxSnapshot`. Runtime code never reads the bundle file directly
 * and never invokes esbuild — the snapshot already contains everything needed to
 * boot the supervisor.
 */
export async function buildResearchSupervisor(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log("[supervisor-build] bundling supervisor…");
  fs.mkdirSync(DIST_DIR, { recursive: true });

  const result = await esbuild.build({
    entryPoints: [SUPERVISOR_ENTRY],
    bundle: true,
    platform: "node",
    target: "node20",
    format: "cjs",
    write: false,
    external: [],
    minify: false,
    sourcemap: "inline",
    logLevel: "warning",
  });

  const out = result.outputFiles?.[0]?.text;
  if (!out) throw new Error("[supervisor-build] esbuild produced no output");

  // The entry file (supervisor/index.ts) already contains
  //   if (require.main === module) { bootSupervisor(); }
  // and that check holds inside the bundle (the bundle IS the main module).
  // We deliberately do NOT append another invocation — doing so would call
  // bootSupervisor() twice and crash the second listen with EADDRINUSE.
  fs.writeFileSync(SUPERVISOR_OUT, out);
  // eslint-disable-next-line no-console
  console.log(`[supervisor-build] wrote ${SUPERVISOR_OUT} (${out.length.toLocaleString()} bytes)`);

  // research-tool is a hand-written zero-dep CJS file — copy verbatim.
  fs.copyFileSync(RESEARCH_TOOL_SOURCE, RESEARCH_TOOL_OUT);
  fs.chmodSync(RESEARCH_TOOL_OUT, 0o755);
  // eslint-disable-next-line no-console
  console.log(`[supervisor-build] wrote ${RESEARCH_TOOL_OUT}`);

  // eslint-disable-next-line no-console
  console.log("[supervisor-build] done");
}

export default buildResearchSupervisor;
