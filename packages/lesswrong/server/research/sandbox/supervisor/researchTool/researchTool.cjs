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
 *   research-tool edit-doc <documentId> replace-text --quote "..." --with "..." [--mode suggest]
 *   research-tool edit-doc <documentId> insert-block --location end --markdown "..." [--mode suggest]
 *   research-tool edit-doc <documentId> delete-block --prefix "..." [--mode suggest]
 *   research-tool edit-doc <documentId> insert-llm-block --model "..." --markdown "..." --location end
 *   research-tool edit-doc <documentId> insert-widget --content "..." --location end
 *   research-tool edit-doc <documentId> replace-widget --widget-id "..." --replacement "..." [--mode suggest]
 *   research-tool comment-doc <documentId> --comment "..." [--quote "..."]
 *   research-tool reply-comment <documentId> --thread-id "..." --comment "..."
 *   research-tool create-doc [--title "..."] [--initial-markdown "..."]
 *   research-tool list-documents
 *   research-tool list-conversations
 *   research-tool fetch-conversation <conversationId> [--with-thinking] [--with-tool-payloads]
 *   research-tool set-presentation (--markdown "..." | --clear)
 *   research-tool exec <conversationId> [--cwd "..."] [--sudo] [--timeout <ms>] [--resume] -- <cmd> [args...]
 *   research-tool kill <conversationId> (--pid <n> | --pattern "...") [--signal <SIG>]
 *
 * Required env (set by the supervisor when launching Claude Code):
 *   RESEARCH_BACKEND_BASE_URL    — e.g. https://forum.example.com
 *   RESEARCH_BACKEND_TOKEN       — sandbox-callback bearer token
 *   RESEARCH_PROJECT_ID          — the project this sandbox is scoped to;
 *                                  used to build URLs (the bearer token also
 *                                  pins the project server-side)
 *   RESEARCH_CONVERSATION_ID     — the current conversation id; useful when
 *                                  comparing fetched transcript/document
 *                                  references against the active session
 *
 * Output: JSON-serialized API response on stdout (one object per invocation).
 * Errors: human-readable message on stderr + non-zero exit code.
 *
 * Distributed as a single .cjs file with zero npm dependencies — T2's
 * supervisor copies it into /vercel/sandbox/research-tool.cjs and shells out
 * via `node research-tool.cjs ...` (or installs a thin wrapper bin).
 */

"use strict";

const REQUIRED_ENV = ["RESEARCH_BACKEND_BASE_URL", "RESEARCH_BACKEND_TOKEN", "RESEARCH_PROJECT_ID"];

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
    fail(1, "edit-doc requires a subcommand: replace-text | insert-block | delete-block | insert-llm-block | insert-widget | replace-widget");
  }

  switch (subcommand) {
    case "replace-text": {
      const quote = args.flags.quote;
      const replacement = args.flags.with ?? args.flags.replacement;
      if (!quote || replacement === undefined) {
        fail(1, "replace-text requires --quote and --with");
      }
      const result = await callApi("POST", "/api/research/agent/documents/replaceText", {
        body: { documentId, quote, replacement, mode: parseMode(args.flags) },
      });
      printJson(result);
      return;
    }
    case "insert-block": {
      const markdown = args.flags.markdown;
      const location = parseLocation(args.flags);
      if (!markdown) fail(1, "insert-block requires --markdown");
      const result = await callApi("POST", "/api/research/agent/documents/insertBlock", {
        body: { documentId, markdown, location, mode: parseMode(args.flags) },
      });
      printJson(result);
      return;
    }
    case "delete-block": {
      const prefix = args.flags.prefix;
      if (!prefix) fail(1, "delete-block requires --prefix");
      const result = await callApi("POST", "/api/research/agent/documents/deleteBlock", {
        body: { documentId, prefix, mode: parseMode(args.flags) },
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
    case "insert-widget": {
      const content = args.flags.content;
      const location = parseLocation(args.flags);
      if (!content) fail(1, "insert-widget requires --content");
      const result = await callApi("POST", "/api/research/agent/documents/insertWidget", {
        body: { documentId, content, location },
      });
      printJson(result);
      return;
    }
    case "replace-widget": {
      const widgetId = args.flags["widget-id"] ?? args.flags.widgetId;
      const replacement = args.flags.replacement;
      const unifiedDiff = args.flags["unified-diff"] ?? args.flags.unifiedDiff;
      if (!widgetId) fail(1, "replace-widget requires --widget-id");
      const opCount = (replacement !== undefined ? 1 : 0) + (unifiedDiff !== undefined ? 1 : 0);
      if (opCount !== 1) {
        fail(1, "replace-widget requires exactly one of --replacement or --unified-diff");
      }
      const body = { documentId, widgetId, mode: parseMode(args.flags) };
      if (replacement !== undefined) body.replacement = replacement;
      if (unifiedDiff !== undefined) body.unifiedDiff = unifiedDiff;
      const result = await callApi("POST", "/api/research/agent/documents/replaceWidget", { body });
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

function parseMode(flags) {
  const mode = flags.mode ?? (flags.suggest !== undefined ? "suggest" : "edit");
  if (mode !== "edit" && mode !== "suggest") {
    fail(1, `Invalid --mode: ${mode}. Use "edit" or "suggest".`);
  }
  return mode;
}

async function cmdCommentDoc(args) {
  const documentId = args.positional[0];
  if (!documentId) fail(1, "comment-doc requires <documentId> as the first positional argument");
  const comment = args.flags.comment;
  if (!comment) fail(1, "comment-doc requires --comment");
  const body = { documentId, comment };
  if (args.flags.quote !== undefined) body.quote = args.flags.quote;
  const result = await callApi("POST", "/api/research/agent/documents/commentOnDocument", { body });
  printJson(result);
}

async function cmdReplyComment(args) {
  const documentId = args.positional[0];
  if (!documentId) fail(1, "reply-comment requires <documentId> as the first positional argument");
  const threadId = args.flags["thread-id"] ?? args.flags.threadId;
  const comment = args.flags.comment;
  if (!threadId || !comment) fail(1, "reply-comment requires --thread-id and --comment");
  const result = await callApi("POST", "/api/research/agent/documents/replyToComment", {
    body: { documentId, threadId, comment },
  });
  printJson(result);
}

async function cmdListDocuments() {
  const projectId = getEnv("RESEARCH_PROJECT_ID");
  const result = await callApi(
    "GET",
    `/api/research/agent/projects/${encodeURIComponent(projectId)}/documents`,
  );
  printJson(result);
}

async function cmdListConversations() {
  const projectId = getEnv("RESEARCH_PROJECT_ID");
  const result = await callApi(
    "GET",
    `/api/research/agent/projects/${encodeURIComponent(projectId)}/conversations`,
  );
  printJson(result);
}

async function cmdCreateDoc(args) {
  const projectId = getEnv("RESEARCH_PROJECT_ID");
  const body = {};
  if (args.flags.title !== undefined) body.title = args.flags.title;
  if (args.flags["initial-markdown"] !== undefined) body.initialMarkdown = args.flags["initial-markdown"];
  const result = await callApi(
    "POST",
    `/api/research/agent/projects/${encodeURIComponent(projectId)}/documents`,
    { body },
  );
  printJson(result);
}

async function cmdDev(args) {
  const action = args.positional[0];
  if (!["start", "stop", "restart"].includes(action)) {
    fail(1, "dev requires an action: start | stop | restart");
  }
  const base = (process.env.RESEARCH_DEV_CONTROL_URL || "http://127.0.0.1:9283").replace(/\/$/, "");
  let res;
  try {
    res = await fetch(`${base}/${action}`, { method: "POST" });
  } catch (err) {
    fail(3, `Could not reach the dev-server controller: ${err && err.message ? err.message : String(err)}`);
  }
  const text = await res.text();
  let parsed;
  try {
    parsed = text.length > 0 ? JSON.parse(text) : null;
  } catch (err) {
    parsed = { raw: text };
  }
  if (!res.ok) {
    fail(res.status >= 500 ? 3 : 4, (parsed && parsed.error) || `HTTP ${res.status}`);
  }
  if (parsed && parsed.managed === false) {
    process.stderr.write(
      "research-tool: note — no dev-server.sh present, so there is no supervisor-managed dev server (this environment may start one from init.sh).\n",
    );
  }
  printJson(parsed || { ok: true, action });
}

async function cmdFetchConversation(args) {
  const conversationId = args.positional[0];
  if (!conversationId) fail(1, "fetch-conversation requires <conversationId>");
  const query = {};
  if (args.flags["with-thinking"] !== undefined) query.withThinking = "1";
  if (args.flags["with-tool-payloads"] !== undefined) query.withToolPayloads = "1";
  const result = await callApi(
    "GET",
    `/api/research/agent/conversations/${encodeURIComponent(conversationId)}/transcript`,
    { query },
  );
  printJson(result);
}

async function cmdSetPresentation(args) {
  const conversationId = process.env.RESEARCH_CONVERSATION_ID;
  if (!conversationId) fail(1, "Missing required env var: RESEARCH_CONVERSATION_ID");
  const clear = args.flags.clear !== undefined;
  const markdown = args.flags.markdown;
  if (clear === (markdown !== undefined)) {
    fail(1, "set-presentation requires exactly one of --markdown <md> or --clear");
  }
  const result = await callApi(
    "POST",
    `/api/research/agent/conversations/${encodeURIComponent(conversationId)}/presentation`,
    { body: { markdown: clear ? null : markdown } },
  );
  printJson(result);
}

async function cmdExec(rawArgs) {
  // Grammar: exec <conversationId> [--cwd <dir>] [--sudo] [--timeout <ms>] [--resume] -- <cmd> [args...]
  // Everything after the first `--` is the command + its arguments, verbatim.
  const sep = rawArgs.indexOf("--");
  if (sep === -1) {
    fail(1, "exec requires a command after `--`: exec <conversationId> [flags] -- <cmd> [args...]");
  }
  const left = parseArgs(rawArgs.slice(0, sep));
  const cmdParts = rawArgs.slice(sep + 1);
  const conversationId = left.positional[0];
  if (!conversationId) fail(1, "exec requires <conversationId> before `--`");
  if (cmdParts.length === 0) fail(1, "exec requires a command after `--`");

  const body = { cmd: cmdParts[0], args: cmdParts.slice(1) };
  if (left.flags.cwd !== undefined) body.cwd = left.flags.cwd;
  if (left.flags.sudo !== undefined) body.sudo = true;
  if (left.flags.resume !== undefined) body.resumeIfStopped = true;
  if (left.flags.timeout !== undefined) {
    const ms = Number(left.flags.timeout);
    if (!Number.isFinite(ms) || ms <= 0) fail(1, "--timeout must be a positive number of milliseconds");
    body.timeoutMs = ms;
  }
  const result = await callApi(
    "POST",
    `/api/research/agent/conversations/${encodeURIComponent(conversationId)}/exec`,
    { body },
  );
  printJson(result);
}

async function cmdKill(args) {
  // Sugar over `exec`: kill <conversationId> (--pid <n> | --pattern <text>) [--signal <SIG>]
  const conversationId = args.positional[0];
  if (!conversationId) fail(1, "kill requires <conversationId>");
  const signal = args.flags.signal ?? "TERM";
  let body;
  if (args.flags.pid !== undefined) {
    body = { cmd: "kill", args: [`-${signal}`, String(args.flags.pid)] };
  } else if (args.flags.pattern !== undefined) {
    body = { cmd: "pkill", args: [`-${signal}`, "-f", args.flags.pattern] };
  } else {
    fail(1, "kill requires one of --pid <n> or --pattern <text>");
  }
  const result = await callApi(
    "POST",
    `/api/research/agent/conversations/${encodeURIComponent(conversationId)}/exec`,
    { body },
  );
  printJson(result);
}

async function cmdHelp() {
  const help = [
    "research-tool — in-sandbox client for the research agent API",
    "",
    "Commands:",
    "  fetch-doc <documentId>",
    "  edit-doc  <documentId> replace-text   --quote <text> --with <markdown> [--mode edit|suggest]",
    "  edit-doc  <documentId> insert-block   --markdown <md> (--location start|end | --before <text> | --after <text>) [--mode edit|suggest]",
    "  edit-doc  <documentId> delete-block   --prefix <text> [--mode edit|suggest]",
    "  edit-doc  <documentId> insert-llm-block --markdown <md> --model <name> (--location start|end | --before ... | --after ...)",
    "  edit-doc  <documentId> insert-widget  --content <html> (--location start|end | --before <text> | --after <text>)",
    "  edit-doc  <documentId> replace-widget --widget-id <id> (--replacement <html> | --unified-diff <diff>) [--mode edit|suggest]",
    "  comment-doc <documentId> --comment <markdown> [--quote <text>]",
    "  reply-comment <documentId> --thread-id <id> --comment <markdown>",
    "  create-doc        [--title <text>] [--initial-markdown <md>]",
    "  list-documents",
    "  list-conversations",
    "  fetch-conversation <conversationId> [--with-thinking] [--with-tool-payloads]",
    "  set-presentation  (--markdown <md> | --clear)   (this conversation's collapsed-block presentation)",
    "  dev       start | stop | restart    (control the supervised dev server)",
    "  exec      <conversationId> [--cwd <dir>] [--sudo] [--timeout <ms>] [--resume] -- <cmd> [args...]",
    "               (run a one-shot shell command in any of this project's sandboxes — e.g. to inspect",
    "                or un-wedge a sibling instance whose sandbox is pegged; attaches to the running",
    "                session and does NOT resume a stopped sandbox unless --resume is passed)",
    "  kill      <conversationId> (--pid <n> | --pattern <text>) [--signal <SIG>]   (sugar over exec)",
    "",
    "Required env: RESEARCH_BACKEND_BASE_URL, RESEARCH_BACKEND_TOKEN, RESEARCH_PROJECT_ID",
  ].join("\n");
  process.stdout.write(help + "\n");
}

// --- main dispatcher -----------------------------------------------------

async function main() {
  const argv = process.argv.slice(2);
  const command = argv[0];
  const rest = parseArgs(argv.slice(1));

  // `dev` and the help screens talk to the local dev controller (or nothing),
  // so they don't need the backend env; everything else fast-fails without it.
  const needsBackendEnv = !["dev", "help", "--help", "-h", undefined].includes(command);
  if (needsBackendEnv) {
    for (const name of REQUIRED_ENV) {
      if (!process.env[name]) {
        fail(1, `Missing required env var: ${name}`);
      }
    }
  }

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
    case "comment-doc":
      await cmdCommentDoc(rest);
      return;
    case "reply-comment":
      await cmdReplyComment(rest);
      return;
    case "create-doc":
      await cmdCreateDoc(rest);
      return;
    case "list-documents":
      await cmdListDocuments();
      return;
    case "list-conversations":
      await cmdListConversations();
      return;
    case "fetch-conversation":
      await cmdFetchConversation(rest);
      return;
    case "set-presentation":
      await cmdSetPresentation(rest);
      return;
    case "dev":
      await cmdDev(rest);
      return;
    case "exec":
      await cmdExec(argv.slice(1));
      return;
    case "kill":
      await cmdKill(rest);
      return;
    default:
      fail(1, `Unknown command: ${command}. Run \`research-tool help\` for usage.`);
  }
}

main().catch((err) => {
  fail(2, err && err.message ? err.message : String(err));
});
