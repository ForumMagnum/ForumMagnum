import { generateText, tool, stepCountIs } from "ai";
import { z } from "zod";
import { $getRoot } from "lexical";
import TypoSuggestions from "@/server/collections/typoSuggestions/collection";
import { getLatestRev } from "@/server/editor/utils";
import { htmlToMarkdown } from "@/server/editor/conversionUtils";
import { withDomGlobals } from "@/server/editor/withDomGlobals";
import { createNotifications } from "@/server/notificationCallbacksHelpers";
import { captureException } from "@/lib/sentryWrapper";
import { loadHtmlIntoHeadlessEditor } from "./headlessLexical";
import { $computeNarrowing } from "../../../../app/api/agent/replaceText/route";
import { findRenderedQuoteInMarkdown, locateMarkdownQuoteSelectionInSubtree } from "../../../../app/api/agent/mapMarkdownToLexical";

const TYPO_EVALUATION_MODEL = "anthropic/claude-opus-4-7";

const TYPO_SYSTEM_PROMPT = `You are checking whether a span of text in a LessWrong post or comment that a reader has flagged as a possible typo is, in fact, a typo.

A "typo" here means a *mechanical* error that an editor would unambiguously fix without further thought:
- misspellings (e.g. "teh" → "the")
- doubled or dropped words (e.g. "the the" → "the")
- missing punctuation that the surrounding sentence clearly requires
- capitalization errors at sentence starts or for proper nouns
- wrong homophones in clear contexts (e.g. "their/there/they're", "its/it's") only when the correct form is unambiguous

A typo is NOT:
- a stylistic choice you would write differently
- a word the author may have chosen deliberately for tone, voice, register, irony, or technical jargon
- a grammatical preference (sentence-initial conjunctions, comma splices, etc.)
- a missing reference, citation, or factual issue
- a phrasing you find awkward but that is grammatical and unambiguous in meaning

When in doubt, call \`no_typo\`.

If you call \`fix_typo\`:

1. The \`original\` field is a markdown excerpt from the document. It serves two purposes — locating the typo in the document, and identifying the text to fix. Include just enough surrounding context that:
    - The excerpt appears exactly once in the document (typically one to a few words is enough), AND
    - The typo is unambiguous within the excerpt.

   Don't quote the entire sentence or paragraph — just enough to anchor the change. The system computes the minimum substitution from \`original\` and \`replacement\` automatically; your job is only to give it a precise, locatable excerpt.

2. Do NOT include markdown source markers (\`**\`, \`_\`, \`\`\`, \`~\`) in \`original\` — they are stripped by the matcher. Do NOT paraphrase, "clean up", or re-type from memory; quote verbatim from the markdown text we provide. Typographic punctuation (smart quotes ↔ ASCII, en/em dashes) is folded automatically; you do not need to normalize it.

3. The \`original\` must appear in the markdown we provide. If the visible text inside the flagged span doesn't actually contain a typo and you'd be reaching to find one elsewhere, call \`no_typo\` instead.

4. The \`replacement\` is the same excerpt with the typo fixed, in markdown. Match the shape of \`original\` — don't expand the diff into unrelated rewrites or "while I'm here" cleanups.

5. The \`explanation\` should be one short sentence describing the typo, suitable for showing to the post author (e.g. "'teh' → 'the' — typo").

Examples of well-sized \`original\`/\`replacement\` pairs:
- Misspelling: \`original: "teh"\`, \`replacement: "the"\`. Just the misspelled word.
- Doubled word: \`original: "the the"\`, \`replacement: "the"\`. Just the duplicated pair.
- Missing word: for "come along way" → "come a long way", \`original: "come along"\`, \`replacement: "come a long"\`. Two-word window — wide enough to anchor, narrow enough to stay focused. Don't return the whole sentence.
- Missing punctuation: for "Yes I do" → "Yes, I do", \`original: "Yes I"\`, \`replacement: "Yes, I"\`. Just enough to place the comma.
- Wrong homophone: for "their the best" → "they're the best", \`original: "their the"\`, \`replacement: "they're the"\`. The bare homophone alone wouldn't be unambiguous in the document.
- Capitalization at sentence start: for "Yes. then we" → "Yes. Then we", \`original: "Yes. then"\`, \`replacement: "Yes. Then"\`. Include the prior period to make the sentence boundary unambiguous.

You will be shown the full document, with the reader's flagged span explicitly delimited like this:
    ... <<<TYPO?>>>flagged text<<<END>>> ...
The bare flagged text is also given separately for cross-checking.

You must call exactly one of the two tools.`;

const fixTypoSchema = z.object({
  original: z.string().describe("A short markdown excerpt that uniquely locates the typo — typically one to a few words around it. Must appear verbatim in the markdown we provided. No markdown emphasis markers."),
  replacement: z.string().describe("The same excerpt with the typo fixed, in markdown. Match the shape of `original`; the system computes the minimum substitution automatically."),
  explanation: z.string().describe("One short sentence describing the typo, shown to the author."),
});

const noTypoSchema = z.object({
  reason: z.string().describe("One short sentence describing why this isn't a typo (or is too ambiguous to fix mechanically)."),
});

interface LlmFixTypo {
  kind: "fix_typo";
  original: string;
  replacement: string;
  explanation: string;
}
interface LlmNoTypo {
  kind: "no_typo";
  reason: string;
}
type LlmResult = LlmFixTypo | LlmNoTypo;

async function callLlm(documentMarkdown: string, renderedQuote: string): Promise<LlmResult | null> {
  // The reactor's quote came from a DOM selection on the rendered post and so
  // omits inline markdown markers (`**`, `_`, `` ` ``, `~`). To anchor the
  // flagged span inside the markdown we hand to the LLM, project the rendered
  // quote onto its markdown-form equivalent. Falls back to the rendered quote
  // verbatim if no projection can be found (block-level structure between the
  // quote's start/end, etc.) — the LLM still gets the bare flagged text in
  // the prompt, just without an anchored span in the document body.
  const located = findRenderedQuoteInMarkdown(documentMarkdown, renderedQuote);
  const markdownQuote = located?.markdownQuote ?? renderedQuote;
  const delimited = injectDelimiters(documentMarkdown, markdownQuote);
  const prompt = `Flagged text:\n${markdownQuote}\n\n--- DOCUMENT START ---\n${delimited}\n--- DOCUMENT END ---`;

  const result = await generateText({
    model: TYPO_EVALUATION_MODEL,
    system: TYPO_SYSTEM_PROMPT,
    prompt,
    tools: {
      fix_typo: tool({
        description: "Report that the flagged span contains a clear, mechanical typo and propose the minimal fix.",
        inputSchema: fixTypoSchema,
      }),
      no_typo: tool({
        description: "Report that the flagged span is not a typo (or is too ambiguous to fix mechanically).",
        inputSchema: noTypoSchema,
      }),
    },
    toolChoice: "required",
    stopWhen: stepCountIs(1),
    maxOutputTokens: 1024,
  });

  const toolCall = result.toolCalls[0];
  if (!toolCall) return null;
  switch (toolCall.toolName) {
    case "fix_typo":
      return { kind: "fix_typo", ...fixTypoSchema.parse(toolCall.input) };
    case "no_typo":
      return { kind: "no_typo", reason: noTypoSchema.parse(toolCall.input).reason };
    default:
      return null;
  }
}

function injectDelimiters(markdown: string, quote: string): string {
  // Find the first occurrence of the quote and wrap it in delimiters.
  // If the quote can't be found verbatim, return the markdown unchanged —
  // the LLM will still see the bare quote in the prompt and can decide
  // (typically `no_typo` if it can't locate the span).
  const idx = markdown.indexOf(quote);
  if (idx === -1) return markdown;
  return (
    markdown.slice(0, idx) +
    "<<<TYPO?>>>" +
    markdown.slice(idx, idx + quote.length) +
    "<<<END>>>" +
    markdown.slice(idx + quote.length)
  );
}

/**
 * Compute the markdown-level common-prefix/suffix narrowing of (quote,
 * replacement) by loading the document HTML into a headless Lexical editor
 * and running `$computeNarrowing` (the same primitive the post agent API
 * uses for the in-editor suggestion-mode diff visualization). Returns the
 * input strings unchanged if narrowing isn't applicable. Used to populate
 * the notification tooltip's diff preview.
 */
function computeNarrowedDiff(
  html: string,
  quote: string,
  replacement: string,
): { narrowedQuote: string; narrowedReplacement: string } {
  return withDomGlobals(() => {
    const editor = loadHtmlIntoHeadlessEditor(html, "NarrowDiff");

    let narrowedQuote = quote;
    let narrowedReplacement = replacement;
    editor.getEditorState().read(() => {
      const root = $getRoot();
      const selectionResult = locateMarkdownQuoteSelectionInSubtree({
        rootNodeKey: root.getKey(),
        markdownQuote: quote,
      });
      if (
        !selectionResult.found ||
        !selectionResult.anchor ||
        !selectionResult.focus
      ) {
        return;
      }
      const narrowing = $computeNarrowing(
        selectionResult.anchor,
        selectionResult.focus,
        quote,
        replacement,
      );
      if (narrowing) {
        narrowedQuote = narrowing.quote;
        narrowedReplacement = narrowing.replacement;
      }
    });

    return { narrowedQuote, narrowedReplacement };
  });
}

async function loadDocumentForLlm(
  documentId: string,
  context: ResolverContext,
): Promise<{ html: string; markdown: string } | null> {
  const rev = await getLatestRev(documentId, "contents", context);
  if (!rev || rev.originalContents?.type !== "lexical") return null;
  const html = rev.html ?? "";
  const markdown = htmlToMarkdown(html);
  return { html, markdown };
}

async function markFailed(suggestionId: string, explanation: string): Promise<void> {
  await TypoSuggestions.rawUpdateOne(
    { _id: suggestionId },
    {
      $set: {
        status: "failed",
        llmVerdict: "error",
        explanation,
        resolvedAt: new Date(),
      },
    },
  );
}

export async function evaluateTypoReact(
  suggestionId: string,
  context: ResolverContext,
): Promise<void> {
  const suggestion = await TypoSuggestions.findOne(suggestionId);
  if (!suggestion || suggestion.status !== "pending") return;

  // htmlToMarkdown (Turndown) can throw on malformed HTML, and we run as a
  // backgroundTask — if we let the throw escape, the row stays `pending`.
  let doc: { html: string; markdown: string } | null;
  try {
    doc = await loadDocumentForLlm(suggestion.documentId, context);
  } catch (err) {
    captureException(err);
    await markFailed(suggestionId, err instanceof Error ? err.message : String(err));
    return;
  }
  if (!doc) {
    await markFailed(suggestionId, "Could not load document for LLM evaluation.");
    return;
  }

  // Third-party LLM call + Zod parse: same backgroundTask state-machine
  // requirement as above.
  let result: LlmResult | null;
  try {
    result = await callLlm(doc.markdown, suggestion.quote);
  } catch (err) {
    captureException(err);
    await markFailed(suggestionId, err instanceof Error ? err.message : String(err));
    return;
  }
  if (!result) {
    await markFailed(suggestionId, "LLM did not return a tool call.");
    return;
  }

  if (result.kind === "no_typo") {
    await TypoSuggestions.rawUpdateOne(
      { _id: suggestionId },
      {
        $set: {
          status: "rejected",
          llmVerdict: "no_typo",
          explanation: result.reason,
          resolvedAt: new Date(),
        },
      },
    );
    return;
  }

  // fix_typo: validate that the LLM's `original` actually appears in the doc.
  if (!doc.markdown.includes(result.original)) {
    await TypoSuggestions.rawUpdateOne(
      { _id: suggestionId },
      {
        $set: {
          status: "rejected",
          llmVerdict: "no_typo",
          explanation: `LLM proposed an 'original' string that is not present in the document: ${JSON.stringify(result.original).slice(0, 200)}`,
          resolvedAt: new Date(),
        },
      },
    );
    return;
  }

  // Compute narrowed diff for the tooltip preview. Best-effort — falls
  // back to the un-narrowed strings if narrowing can't be computed.
  let narrowedQuote = result.original;
  let narrowedReplacement = result.replacement;
  try {
    const narrowed = computeNarrowedDiff(doc.html, result.original, result.replacement);
    narrowedQuote = narrowed.narrowedQuote;
    narrowedReplacement = narrowed.narrowedReplacement;
  } catch (err) {
    captureException(err);
  }

  await TypoSuggestions.rawUpdateOne(
    { _id: suggestionId },
    {
      $set: {
        status: "pending",
        llmVerdict: "fix_typo",
        // Keep `quote` (reactor's rendered selection) immutable so the
        // cross-user dedup unique index stays stable; store the LLM's
        // markdown-form span separately for apply-time matching.
        llmCanonicalQuote: result.original,
        proposedReplacement: result.replacement,
        narrowedQuote,
        narrowedReplacement,
        explanation: result.explanation,
      },
    },
  );

  await createNotifications({
    userIds: [suggestion.authorId],
    notificationType: "typoSuggestion",
    documentType: "typoSuggestion",
    documentId: suggestionId,
    context,
  });
}
