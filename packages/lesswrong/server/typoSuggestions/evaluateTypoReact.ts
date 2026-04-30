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
import { locateMarkdownQuoteSelectionInSubtree } from "../../../../app/api/agent/mapMarkdownToLexical";

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

If you do call \`fix_typo\`, follow these rules — they match the contract of the underlying replaceText editor API:

1. The \`original\` field must match the *visible rendered text* of the flagged span (or a substring of it), exactly as a reader would see it in the document. Do NOT include markdown source markers (\`**\`, \`_\`, \`\`\`, \`~\`) — they are stripped by the matcher. Do NOT paraphrase, "clean up", or re-type from memory; quote verbatim from the markdown text we provide. Typographic punctuation (smart quotes ↔ ASCII, en/em dashes) is folded automatically; you do not need to normalize it.
2. The \`original\` must appear in the markdown we provide. If the visible text inside the flagged span doesn't actually contain a typo and you'd be reaching to find one elsewhere, call \`no_typo\` instead.
3. The \`replacement\` should be in markdown. It is fed back through the same replaceText pipeline that human-driven and agent-driven edits use. Make it the *smallest* change that resolves the typo — do not expand the diff into unrelated rewrites or "while I'm here" cleanups. If the typo is in a word, replace just that word. If it's a missing comma, add just the comma in context.
4. The \`explanation\` should be one short sentence describing the typo, suitable for showing to the post author (e.g. "'teh' → 'the' — typo").

You will be shown the full document, with the reader's flagged span explicitly delimited like this:
    ... <<<TYPO?>>>flagged text<<<END>>> ...
The bare flagged text is also given separately for cross-checking.

You must call exactly one of the two tools.`;

const fixTypoSchema = z.object({
  original: z.string().describe("The exact substring of the rendered document text that contains the typo. Must appear verbatim in the markdown we provided. No markdown emphasis markers."),
  replacement: z.string().describe("The corrected text, in markdown. The smallest change that fixes the typo."),
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

async function callLlm(documentMarkdown: string, quote: string): Promise<LlmResult | null> {
  const delimited = injectDelimiters(documentMarkdown, quote);
  const prompt = `Flagged text:\n${quote}\n\n--- DOCUMENT START ---\n${delimited}\n--- DOCUMENT END ---`;

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
  if (toolCall.toolName === "fix_typo") {
    const parsed = fixTypoSchema.parse(toolCall.input);
    return { kind: "fix_typo", ...parsed };
  }
  if (toolCall.toolName === "no_typo") {
    const parsed = noTypoSchema.parse(toolCall.input);
    return { kind: "no_typo", reason: parsed.reason };
  }
  return null;
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

interface DocumentRecipients {
  authorId: string;
  coauthorIds: string[];
}

async function getRecipientsForSuggestion(
  collectionName: string,
  documentId: string,
  context: ResolverContext,
): Promise<DocumentRecipients | null> {
  if (collectionName === "Posts") {
    const post = await context.Posts.findOne(documentId);
    if (!post) return null;
    return { authorId: post.userId, coauthorIds: post.coauthorUserIds ?? [] };
  }
  if (collectionName === "Comments") {
    const comment = await context.Comments.findOne(documentId);
    if (!comment || !comment.userId) return null;
    return { authorId: comment.userId, coauthorIds: [] };
  }
  return null;
}

export async function evaluateTypoReact(
  suggestionId: string,
  context: ResolverContext,
): Promise<void> {
  let suggestion: DbTypoSuggestion | null = null;
  try {
    suggestion = await TypoSuggestions.findOne(suggestionId);
    if (!suggestion || suggestion.status !== "pending") return;

    const doc = await loadDocumentForLlm(suggestion.documentId, context);
    if (!doc) {
      await TypoSuggestions.rawUpdateOne(
        { _id: suggestionId },
        { $set: { status: "failed", llmVerdict: "error", resolvedAt: new Date() } },
      );
      return;
    }

    const result = await callLlm(doc.markdown, suggestion.quote);
    if (!result) {
      await TypoSuggestions.rawUpdateOne(
        { _id: suggestionId },
        {
          $set: {
            status: "failed",
            llmVerdict: "error",
            explanation: "LLM did not return a tool call.",
            resolvedAt: new Date(),
          },
        },
      );
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
          // Store the LLM's `original` as the canonical quote for apply-time
          // matching; this may differ slightly from the reactor's quote.
          quote: result.original,
          proposedReplacement: result.replacement,
          narrowedQuote,
          narrowedReplacement,
          explanation: result.explanation,
        },
      },
    );

    // Notify the document's author (and coauthors).
    const recipients = await getRecipientsForSuggestion(
      suggestion.collectionName,
      suggestion.documentId,
      context,
    );
    if (recipients) {
      const userIds = [recipients.authorId, ...recipients.coauthorIds];
      await createNotifications({
        userIds,
        notificationType: "typoSuggestion",
        documentType: "typoSuggestion",
        documentId: suggestionId,
        context,
      });
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("evaluateTypoReact failed", suggestionId, err);
    captureException(err);
    if (suggestion) {
      await TypoSuggestions.rawUpdateOne(
        { _id: suggestionId },
        {
          $set: {
            status: "failed",
            llmVerdict: "error",
            explanation: err instanceof Error ? err.message : String(err),
            resolvedAt: new Date(),
          },
        },
      ).catch(() => {});
    }
  }
}
