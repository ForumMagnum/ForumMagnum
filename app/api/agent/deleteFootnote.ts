import { $getFootnoteItems, $removeFootnote } from "@/components/editor/lexicalPlugins/footnotes/helpers";
import type { ReplaceMode } from "./toolSchemas";

interface DeleteFootnoteResult {
  deleted: boolean
  note: string
  deletionIndex?: number
}

/**
 * Handle explicit footnote definition locators before normal block matching.
 * The ID identifies the whole footnote; any text after the colon is ignored.
 * Returns null for ordinary block prefixes. Must run in a Lexical update.
 */
export function $deleteFootnoteByPrefix(prefix: string, mode: ReplaceMode): DeleteFootnoteResult | null {
  const match = /^\s*\[\^([^\]\s]+)\]:/.exec(prefix);
  if (!match) return null;

  const footnoteId = match[1];
  const matches = [];
  for (const item of $getFootnoteItems()) {
    if (item.getFootnoteId() === footnoteId) matches.push(item);
  }
  if (matches.length !== 1) {
    return {
      deleted: false,
      note: matches.length === 0
        ? `No footnote has ID "${footnoteId}".`
        : `Ambiguous footnote ID "${footnoteId}": ${matches.length} definitions found.`,
    };
  }

  // Marking just the definition's text would leave the footnote and its
  // references behind on acceptance. Only support removing them together.
  if (mode === "suggest") {
    return {
      deleted: false,
      note: 'Footnote deletion cannot be represented as a deletion suggestion. Retry with mode "edit" to remove the definition and its references.',
    };
  }

  const footnote = matches[0];
  const deletionIndex = footnote.getIndexWithinParent();
  $removeFootnote(footnote);
  return {
    deleted: true,
    note: "Deleted footnote definition and its references.",
    deletionIndex,
  };
}
