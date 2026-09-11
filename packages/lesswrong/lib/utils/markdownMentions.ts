import type markdownIt from "markdown-it";
import type { StateInline } from "markdown-it/index.js";
import {
  MENTION_DOM_CLASS,
  tryParseMentionAt,
} from "@/components/research/lexical/mentionFormat";

export function markdownMentions(md: markdownIt): void {
  md.inline.ruler.before("emphasis", "research_mention", parseMentionInline);
  md.renderer.rules.research_mention = (tokens, idx) => {
    const escapeHtml = md.utils.escapeHtml;
    const t = tokens[idx];
    const kind = t.attrGet("data-mention-kind") ?? "";
    const id = t.attrGet("data-mention-id") ?? "";
    const title = t.attrGet("data-mention-title") ?? "";
    return `<span class="${MENTION_DOM_CLASS}" data-mention-kind="${escapeHtml(kind)}" data-mention-id="${escapeHtml(id)}" data-mention-title="${escapeHtml(title)}">${escapeHtml(title)}</span>`;
  };
}

function parseMentionInline(state: StateInline, silent: boolean): boolean {
  if (state.src.charCodeAt(state.pos) !== 0x40 /* @ */) return false;
  if (state.src.charCodeAt(state.pos + 1) !== 0x5B /* [ */) return false;

  const match = tryParseMentionAt(state.src, state.pos);
  if (!match) return false;

  if (silent) return true;

  const token = state.push("research_mention", "span", 0);
  token.markup = match.raw;
  token.attrSet("data-mention-kind", match.kind);
  token.attrSet("data-mention-id", match.id);
  token.attrSet("data-mention-title", match.title);
  token.content = match.title;

  state.pos += match.raw.length;
  return true;
}
