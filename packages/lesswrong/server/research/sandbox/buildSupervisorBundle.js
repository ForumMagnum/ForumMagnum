/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const esbuild = require("esbuild");

// Co-located with `supervisor/` and `dist/`, so every path hangs off __dirname.
const SANDBOX_DIR = __dirname;
const SUPERVISOR_ENTRY = path.join(SANDBOX_DIR, "supervisor/index.ts");
const RESEARCH_TOOL_SOURCE = path.join(SANDBOX_DIR, "supervisor/researchTool/researchTool.cjs");
const DIST_DIR = path.join(SANDBOX_DIR, "dist");
const SUPERVISOR_OUT = path.join(DIST_DIR, "supervisor.js");
const RESEARCH_TOOL_OUT = path.join(DIST_DIR, "research-tool.cjs");

/**
 * Build-time bundler for the in-sandbox supervisor.
 *
 * Outputs a single CommonJS file to `dist/` that runs in the sandbox's vanilla
 * `node24` runtime with zero npm dependencies. esbuild compiles the TypeScript
 * entry directly, so this script is plain Node (no ts-node) and only depends on
 * esbuild — it must run with no DB connection, both for local dev (`yarn
 * research-supervisor-build`) and as a step in the deploy build.
 *
 * The output is uploaded into the sandbox snapshot by
 * `buildResearchSandboxSnapshot` and overlaid at launch from the deployed
 * server's `dist/`. Runtime code never reads esbuild or rebuilds the bundle.
 */
async function main() {
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

  // The entry (supervisor/index.ts) already gates boot on `require.main === module`,
  // which holds inside the bundle (the bundle IS the main module). Appending another
  // invocation would boot twice and crash the second listen with EADDRINUSE.
  fs.writeFileSync(SUPERVISOR_OUT, out);
  console.log(`[supervisor-build] wrote ${SUPERVISOR_OUT} (${out.length.toLocaleString()} bytes)`);

  // research-tool is a hand-written zero-dep CJS file — copy verbatim.
  fs.copyFileSync(RESEARCH_TOOL_SOURCE, RESEARCH_TOOL_OUT);
  fs.chmodSync(RESEARCH_TOOL_OUT, 0o755);
  console.log(`[supervisor-build] wrote ${RESEARCH_TOOL_OUT}`);

  console.log("[supervisor-build] done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
