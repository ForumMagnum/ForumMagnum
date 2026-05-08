#!/usr/bin/env node
/* eslint-disable */
/**
 * `research-tool` — in-sandbox CLI wrapper around the agent-facing HTTP API.
 *
 * Deployed verbatim into the Vercel Sandbox by T2's supervisor (via
 * `sandbox.writeFiles`). Claude Code invokes this binary from inside the
 * sandbox, e.g.:
 *
 *   research-tool fetch-doc <documentId>
 *   research-tool edit-doc <documentId> replace-text --quote "..." --with "..."
 *   research-tool edit-doc <documentId> insert-block --location end --markdown "..."
 *   research-tool edit-doc <documentId> delete-block --prefix "..."
 *   research-tool edit-doc <documentId> insert-llm-block --model "..." --markdown "..." --location end
 *   research-tool fetch-events <conversationId> [--since-seq N] [--limit M]
 *   research-tool list-project [--project-id <id>]
 *   research-tool spawn --prompt "..." [--title "..."]
 *
 * Required env (set by the supervisor when launching Claude Code):
 *   RESEARCH_BACKEND_BASE_URL    — e.g. https://forum.example.com
 *   RESEARCH_BACKEND_TOKEN       — sandbox-callback bearer token; ≤30 min TTL
 *   RESEARCH_PROJECT_ID          — convenience for `list-project` (no flag needed)
 *
 * Output: JSON-serialized API response on stdout (one object per invocation).
 * Errors: human-readable message on stderr + non-zero exit code.
 *
 * Distributed as a single .cjs file with zero npm dependencies — T2's
 * supervisor copies it into /vercel/sandbox/research-tool.cjs and shells out
 * via `node research-tool.cjs ...` (or installs a thin wrapper bin).
 */

"use strict";

const REQUIRED_ENV = ["RESEARCH_BACKEND_BASE_URL", "RESEARCH_BACKEND_TOKEN"];

function getEnv(name) {
  const v = process.env[name];
  if (!v) {
    fail(1, `Missing required env var: ${name}`);
  }
  return v;
}

function fail(code, message, details) {
  process.stderr.write(`research-tool: ${message}\n`);
  if (details) {
    process.stderr.write(typeof details === "string" ? details + "\n" : JSON.stringify(details, null, 2) + "\n");
  }
  process.exit(code);
}

function printJson(value) {
  process.stdout.write(JSON.stringify(value) + "\n");
}

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token.startsWith("--")) {
      const flagName = token.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) {
        flags[flagName] = "true";
      } else {
        flags[flagName] = next;
        i += 1;
      }
    } else {
      positional.push(token);
    }
  }
  return { positional, flags };
}

async function callApi(method, path, options = {}) {
  const baseUrl = getEnv("RESEARCH_BACKEND_BASE_URL").replace(/\/$/, "");
  const token = getEnv("RESEARCH_BACKEND_TOKEN");
  const url = new URL(baseUrl + path);
  if (options.query) {
    for (const [k, v] of Object.entries(options.query)) {
      if (v !== undefined && v !== null) {
        url.searchParams.set(k, String(v));
      }
    }
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };
  let body;
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  const res = await fetch(url.toString(), { method, headers, body });
  const text = await res.text();
  let parsed;
  try {
    parsed = text.length > 0 ? JSON.parse(text) : null;
  } catch (err) {
    fail(2, `Non-JSON response from ${path} (status ${res.status}): ${text.slice(0, 500)}`);
  }
  if (!res.ok) {
    const errMsg = parsed && parsed.error ? parsed.error : `HTTP ${res.status}`;
    fail(res.status >= 500 ? 3 : 4, errMsg, parsed && parsed.details);
  }
  return parsed;
}

// --- subcommands ---------------------------------------------------------

async function cmdFetchDoc(args) {
  const documentId = args.positional[0];
  if (!documentId) fail(1, "fetch-doc requires <documentId> as the first positional argument");
  const result = await callApi("GET", `/api/research/agent/documents/${encodeURIComponent(documentId)}`);
  printJson(result);
}

async function cmdEditDoc(args) {
  const documentId = args.positional[0];
  const subcommand = args.positional[1];
  if (!documentId) fail(1, "edit-doc requires <documentId> as the first positional argument");
  if (!subcommand) {
    fail(1, "edit-doc requires a subcommand: replace-text | insert-block | delete-block | insert-llm-block");
  }

  switch (subcommand) {
    case "replace-text": {
      const quote = args.flags.quote;
      const replacement = args.flags.with ?? args.flags.replacement;
      if (!quote || replacement === undefined) {
        fail(1, "replace-text requires --quote and --with");
      }
      const result = await callApi("POST", "/api/research/agent/documents/replaceText", {
        body: { documentId, quote, replacement },
      });
      printJson(result);
      return;
    }
    case "insert-block": {
      const markdown = args.flags.markdown;
      const location = parseLocation(args.flags);
      if (!markdown) fail(1, "insert-block requires --markdown");
      const result = await callApi("POST", "/api/research/agent/documents/insertBlock", {
        body: { documentId, markdown, location },
      });
      printJson(result);
      return;
    }
    case "delete-block": {
      const prefix = args.flags.prefix;
      if (!prefix) fail(1, "delete-block requires --prefix");
      const result = await callApi("POST", "/api/research/agent/documents/deleteBlock", {
        body: { documentId, prefix },
      });
      printJson(result);
      return;
    }
    case "insert-llm-block": {
      const markdown = args.flags.markdown;
      const modelName = args.flags.model ?? args.flags["model-name"];
      const location = parseLocation(args.flags);
      if (!markdown) fail(1, "insert-llm-block requires --markdown");
      const result = await callApi("POST", "/api/research/agent/documents/insertLLMBlock", {
        body: { documentId, markdown, modelName, location },
      });
      printJson(result);
      return;
    }
    default:
      fail(1, `Unknown edit-doc subcommand: ${subcommand}`);
  }
}

function parseLocation(flags) {
  if (flags.location === "start" || flags.location === "end") {
    return flags.location;
  }
  if (flags.before) return { before: flags.before };
  if (flags.after) return { after: flags.after };
  fail(1, "location required: pass --location start|end OR --before <text> OR --after <text>");
  return undefined;
}

async function cmdFetchEvents(args) {
  const conversationId = args.positional[0];
  if (!conversationId) fail(1, "fetch-events requires <conversationId>");
  const sinceSeq = args.flags["since-seq"];
  const limit = args.flags.limit;
  const query = {};
  if (sinceSeq !== undefined) query.sinceSeq = sinceSeq;
  if (limit !== undefined) query.limit = limit;
  const result = await callApi(
    "GET",
    `/api/research/agent/conversations/${encodeURIComponent(conversationId)}/events`,
    { query },
  );
  printJson(result);
}

async function cmdListDocuments(args) {
  const projectId = args.flags["project-id"] ?? process.env.RESEARCH_PROJECT_ID;
  if (!projectId) {
    fail(1, "list-documents requires --project-id or RESEARCH_PROJECT_ID env var");
  }
  const result = await callApi(
    "GET",
    `/api/research/agent/projects/${encodeURIComponent(projectId)}/documents`,
  );
  printJson(result);
}

async function cmdListConversations(args) {
  const projectId = args.flags["project-id"] ?? process.env.RESEARCH_PROJECT_ID;
  if (!projectId) {
    fail(1, "list-conversations requires --project-id or RESEARCH_PROJECT_ID env var");
  }
  const result = await callApi(
    "GET",
    `/api/research/agent/projects/${encodeURIComponent(projectId)}/conversations`,
  );
  printJson(result);
}

async function cmdSpawn(args) {
  const prompt = args.flags.prompt;
  const title = args.flags.title;
  if (!prompt) fail(1, "spawn requires --prompt");
  const body = { prompt };
  if (title) body.title = title;
  const result = await callApi("POST", "/api/research/agent/conversations", { body });
  printJson(result);
}

async function cmdHelp() {
  const help = [
    "research-tool — in-sandbox client for the research agent API",
    "",
    "Commands:",
    "  fetch-doc <documentId>",
    "  edit-doc  <documentId> replace-text   --quote <text> --with <markdown>",
    "  edit-doc  <documentId> insert-block   --markdown <md> (--location start|end | --before <text> | --after <text>)",
    "  edit-doc  <documentId> delete-block   --prefix <text>",
    "  edit-doc  <documentId> insert-llm-block --markdown <md> --model <name> (--location start|end | --before ... | --after ...)",
    "  fetch-events <conversationId> [--since-seq N] [--limit M]",
    "  list-documents     [--project-id <id>]",
    "  list-conversations [--project-id <id>]",
    "  spawn --prompt <text> [--title <text>]",
    "",
    "Required env: RESEARCH_BACKEND_BASE_URL, RESEARCH_BACKEND_TOKEN",
  ].join("\n");
  process.stdout.write(help + "\n");
}

// --- main dispatcher -----------------------------------------------------

async function main() {
  for (const name of REQUIRED_ENV) {
    // Ensure required env is present early — fast-fail before parsing args.
    if (!process.env[name]) {
      fail(1, `Missing required env var: ${name}`);
    }
  }

  const argv = process.argv.slice(2);
  const command = argv[0];
  const rest = parseArgs(argv.slice(1));

  switch (command) {
    case undefined:
    case "help":
    case "--help":
    case "-h":
      await cmdHelp();
      return;
    case "fetch-doc":
      await cmdFetchDoc(rest);
      return;
    case "edit-doc":
      await cmdEditDoc(rest);
      return;
    case "fetch-events":
      await cmdFetchEvents(rest);
      return;
    case "list-documents":
      await cmdListDocuments(rest);
      return;
    case "list-conversations":
      await cmdListConversations(rest);
      return;
    case "spawn":
      await cmdSpawn(rest);
      return;
    default:
      fail(1, `Unknown command: ${command}. Run \`research-tool help\` for usage.`);
  }
}

main().catch((err) => {
  fail(2, err && err.message ? err.message : String(err));
});
