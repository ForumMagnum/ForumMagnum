/**
 * Lightweight line-buffered JSONL parser for Claude Code stdout.
 *
 * Important property: the parser hands callers the **verbatim** raw line text
 * AND the parsed object alongside. Persistence stores the raw line so we
 * preserve --resume compatibility if Claude Code's JSONL shape changes
 * (per design doc: "Store JSONL events as verbatim line text, not parsed/reformed").
 */

export interface ParsedJsonlLine {
  /** Verbatim line text, no trailing newline. Source of truth for persistence. */
  raw: string;
  /** Parsed JSON. `null` if the line was empty or unparseable (rare). */
  parsed: Record<string, unknown> | null;
  /** Convenience: the discriminator from `type`/`message.type` if recognizable. */
  kind: ClaudeEventKind;
  /** If present in the parsed JSON. */
  claudeMessageUuid: string | null;
  /** If present in the parsed JSON. */
  sessionId: string | null;
}

export type ClaudeEventKind =
  | "user"
  | "assistant"
  | "tool_use"
  | "tool_result"
  | "thinking"
  | "system"
  | "error"
  | "result"
  | "unknown";

/**
 * Stateful chunker — feed `push(chunk)` whatever you read from stdout, and
 * call `flush()` once at EOF to drain any final partial line that didn't
 * end with `\n`.
 */
export function createJsonlChunker(): {
  push(chunk: string | Buffer): ParsedJsonlLine[];
  flush(): ParsedJsonlLine[];
} {
  let pending = "";

  function emit(line: string): ParsedJsonlLine | null {
    if (line.length === 0) return null;
    let parsed: Record<string, unknown> | null = null;
    try {
      const v = JSON.parse(line);
      if (v && typeof v === "object" && !Array.isArray(v)) {
        parsed = v as Record<string, unknown>;
      }
    } catch {
      parsed = null;
    }
    return {
      raw: line,
      parsed,
      kind: detectKind(parsed),
      claudeMessageUuid: extractMessageUuid(parsed),
      sessionId: extractSessionId(parsed),
    };
  }

  return {
    push(chunk) {
      const text = typeof chunk === "string" ? chunk : chunk.toString("utf8");
      pending += text;
      const out: ParsedJsonlLine[] = [];
      let nl: number;
      while ((nl = pending.indexOf("\n")) >= 0) {
        const line = pending.slice(0, nl);
        pending = pending.slice(nl + 1);
        const parsed = emit(line);
        if (parsed) out.push(parsed);
      }
      return out;
    },
    flush() {
      const remainder = pending;
      pending = "";
      const parsed = emit(remainder);
      return parsed ? [parsed] : [];
    },
  };
}

function detectKind(parsed: Record<string, unknown> | null): ClaudeEventKind {
  if (!parsed) return "unknown";
  const t = parsed.type;
  if (typeof t !== "string") return "unknown";
  switch (t) {
    case "user":
      // Claude Code's stream-json wraps tool_results inside a `user`-typed
      // line whose `message.content` is an array of `tool_result` parts. The
      // outer `type` is "user" because the model receives them as if from
      // the user role, but they aren't a user prompt — re-classifying them
      // as `tool_result` keeps downstream code (display filters, in-flight
      // detection that compares user-prompt-count to result-count) honest.
      return looksLikeToolResultUser(parsed) ? "tool_result" : "user";
    case "assistant":
    case "system":
    case "result":
    case "tool_use":
    case "tool_result":
    case "thinking":
    case "error":
      return t;
    default:
      return "unknown";
  }
}

function looksLikeToolResultUser(parsed: Record<string, unknown>): boolean {
  const message = parsed.message;
  if (!message || typeof message !== "object") return false;
  const content = (message as Record<string, unknown>).content;
  if (!Array.isArray(content) || content.length === 0) return false;
  return content.every(
    (part) =>
      part !== null &&
      typeof part === "object" &&
      (part as Record<string, unknown>).type === "tool_result",
  );
}

function extractMessageUuid(parsed: Record<string, unknown> | null): string | null {
  if (!parsed) return null;
  if (typeof parsed.uuid === "string") return parsed.uuid;
  const message = parsed.message;
  if (message && typeof message === "object") {
    const id = (message as Record<string, unknown>).id;
    if (typeof id === "string") return id;
  }
  return null;
}

function extractSessionId(parsed: Record<string, unknown> | null): string | null {
  if (!parsed) return null;
  if (typeof parsed.session_id === "string") return parsed.session_id;
  return null;
}
