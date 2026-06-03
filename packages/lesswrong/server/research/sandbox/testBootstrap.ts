/* eslint-disable no-console */
import * as fs from "node:fs";
import * as path from "node:path";
import { homedir } from "node:os";
import { randomUUID } from "node:crypto";
import { createAdminContext } from "@/server/vulcan-lib/createContexts";
import { buildBootstrapJsonl } from "@/server/research/sessionReconstruction";

/**
 * Local test harness for the bootstrap reconstruction. Picks a real
 * conversation from the dev DB, runs the same translation that
 * `continueResearchConversation` would for a fresh-sandbox resume, and
 * writes the result to a fresh session jsonl on this machine. Caller then
 * runs `claude --resume <printed-id>` against that file by hand to see
 * whether the reconstructed history actually parses + reads back as prior
 * context, and to inspect `usage.cache_read_input_tokens` from the response.
 *
 * Invoke with:
 *   yarn repl dev lw packages/lesswrong/server/research/sandbox/testBootstrap.ts
 *
 * Optional: set `RESEARCH_TEST_CONVERSATION_ID=<id>` to target a specific
 * conversation; default is the most-recently-active one in the DB.
 */
export default async function testBootstrap() {
  const context = createAdminContext();
  const { ResearchConversations } = context;

  // Pick the conversation: either from the env var or the most-recently-active
  // one we have. We need a session id to feed `claude --resume`, so we pull
  // it out of the conversation row when populated, and otherwise sniff the
  // first persisted Claude-format event for its embedded session_id (which is
  // what would have been on `ResearchConversations.claudeSessionId` once the
  // backfill from the events route had a chance to fire).
  const explicitConvId = process.env.RESEARCH_TEST_CONVERSATION_ID;
  const conv = explicitConvId
    ? await ResearchConversations.findOne({ _id: explicitConvId })
    : (await ResearchConversations.find({}, { sort: { lastActivityAt: -1 }, limit: 1 }).fetch())[0];
  if (!conv) {
    console.error("No conversation found");
    return;
  }
  console.log(`[bootstrap-test] using conversation _id=${conv._id} project=${conv.projectId}`);

  const events = await context.ResearchConversationEvents.find(
    { conversationId: conv._id },
    { sort: { seq: 1 } },
  ).fetch();
  let claudeSessionId = conv.claudeSessionId ?? null;
  if (!claudeSessionId) {
    for (const e of events) {
      const p = e.payload;
      if (p && typeof p === "object" && !Array.isArray(p)) {
        const sid = (p as Record<string, unknown>).session_id;
        if (typeof sid === "string") { claudeSessionId = sid; break; }
      }
    }
  }
  if (!claudeSessionId) {
    console.error("Conversation has no Claude session id (row + events both lack one)");
    return;
  }
  console.log(`[bootstrap-test] original claude session id=${claudeSessionId}`);

  // Use a fresh filename so we don't collide with any real session file on
  // disk; the in-line `sessionId` baked into every event is the original
  // one (so cache continuity with the prior Anthropic call survives, if any
  // of it's still TTL-warm).
  const testSessionId = randomUUID();
  console.log(`[bootstrap-test] test session id (filename)=${testSessionId}`);

  const lines = buildBootstrapJsonl(events, claudeSessionId);
  console.log(`[bootstrap-test] bootstrap line count=${lines.length}`);
  // Sanity print: first + last line for visual diff against a real session
  // jsonl in ~/.claude/projects/.
  if (lines.length > 0) {
    console.log(`[bootstrap-test] first line:\n  ${lines[0].slice(0, 400)}…`);
    console.log(`[bootstrap-test] last line:\n  ${lines[lines.length - 1].slice(0, 400)}…`);
  }

  // Local Claude Code expects: ~/.claude/projects/<encoded-cwd>/<sessionId>.jsonl
  // where <encoded-cwd> replaces `/` with `-`. We mirror the *current*
  // working directory so `claude --resume` from this checkout finds the file.
  const localCwd = process.cwd();
  const encodedCwd = localCwd.replace(/\//g, "-");
  const projectDir = path.join(homedir(), ".claude", "projects", encodedCwd);
  fs.mkdirSync(projectDir, { recursive: true });

  const filePath = path.join(projectDir, `${testSessionId}.jsonl`);
  const body = lines.join("\n") + (lines.length > 0 ? "\n" : "");
  fs.writeFileSync(filePath, body, "utf8");
  console.log(`[bootstrap-test] wrote ${body.length.toLocaleString()} bytes to ${filePath}`);
  console.log("");
  console.log("Now run, in a separate terminal at this checkout's cwd:");
  console.log(`  claude --resume ${testSessionId} -p "What was the last thing I asked you?" --output-format stream-json --verbose`);
  console.log("");
  console.log("Then run a second time with the same session to see cache_read_input_tokens grow:");
  console.log(`  claude --resume ${testSessionId} -p "And what's the very first thing I asked?" --output-format stream-json --verbose`);
}
