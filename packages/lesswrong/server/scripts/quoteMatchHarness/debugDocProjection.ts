import "./replCssStub";
import fs from "fs";
import path from "path";
import { $getRoot, type LexicalNode, $isElementNode } from "lexical";
import { $generateHtmlFromNodes } from "@lexical/html";
import { $isMathNode } from "@/components/editor/lexicalPlugins/math/MathNode";
import { withDomGlobals } from "@/server/editor/withDomGlobals";
import { formatMathToken, findMathSpansInMarkdown } from "@/lib/utils/mathTokens";
import { createHeadlessEditor } from "../../../../../app/api/agent/editorAgentUtil";
import { $projectDocumentText } from "../../../../../app/api/agent/quoteLocator";
import {
  normalizeTracked,
  projectQuoteToRenderedText,
} from "../../../../../app/api/agent/textIndexQuoteLocator";
import { hydrateEditorFromYjsBinary } from "../../../../../app/hocuspocusWebhook/yjsToHtml";
import { lexicalEditorToAgentMarkdown } from "../../../../../app/api/agent/agentMarkdownView";
import { CORPUS_DIR, type CorpusDocument } from "./harnessShared";

/**
 * Debug utility: print the math-node inventory and projection details of one
 * corpus document. Only for use on published posts (corpus policy).
 *
 * Run via: yarn repl dev lw .../debugDocProjection.ts "debugDocMath('<postId>')"
 */
export async function debugDocMath(postId: string): Promise<void> {
  /* eslint-disable no-console */
  const corpusDocument = JSON.parse(
    fs.readFileSync(path.join(CORPUS_DIR, `${postId}.json`), "utf8"),
  ) as CorpusDocument;
  const editor = createHeadlessEditor("DebugDocProjection");
  withDomGlobals(() => hydrateEditorFromYjsBinary(
    editor,
    new Uint8Array(Buffer.from(corpusDocument.yjsStateBase64, "base64")),
  ));

  editor.getEditorState().read(() => {
    const walk = (node: LexicalNode) => {
      if ($isMathNode(node)) {
        const equation = node.getEquation();
        const token = formatMathToken({ equation, inline: node.isInline() });
        const collapsed = token.replace(/\s+/g, " ").trim();
        const reparsed = findMathSpansInMarkdown(collapsed);
        console.log(JSON.stringify({
          inline: node.isInline(),
          equation: equation.slice(0, 120),
          token: token.slice(0, 140),
          reparsedAfterCollapse: reparsed.length,
        }));
      }
      if ($isElementNode(node)) {
        for (const child of node.getChildren()) walk(child);
      }
    };
    walk($getRoot());
  });

  const agentMarkdown = lexicalEditorToAgentMarkdown(editor);
  const markdownSpans = findMathSpansInMarkdown(agentMarkdown);
  console.log(`agent markdown math spans: ${markdownSpans.length}`);
  for (const span of markdownSpans.slice(0, 10)) {
    console.log(JSON.stringify({ inline: span.inline, equation: span.equation.slice(0, 120) }));
  }
  /* eslint-enable no-console */
}

/**
 * Print raw windows of the tree projection and the agent markdown around the
 * first occurrence of `needle`, before any normalization. Published posts only.
 */
export async function debugDocWindow(postId: string, needle: string): Promise<void> {
  /* eslint-disable no-console */
  const corpusDocument = JSON.parse(
    fs.readFileSync(path.join(CORPUS_DIR, `${postId}.json`), "utf8"),
  ) as CorpusDocument;
  const editor = createHeadlessEditor("DebugDocProjection");
  withDomGlobals(() => hydrateEditorFromYjsBinary(
    editor,
    new Uint8Array(Buffer.from(corpusDocument.yjsStateBase64, "base64")),
  ));

  let projected = "";
  editor.getEditorState().read(() => {
    projected = $projectDocumentText().text;
  });
  const agentMarkdown = lexicalEditorToAgentMarkdown(editor);

  let html = "";
  withDomGlobals(() => {
    editor.getEditorState().read(() => {
      html = $generateHtmlFromNodes(editor, null);
    });
  });

  for (const [label, text] of [["tree", projected], ["markdown", agentMarkdown], ["html", html]] as const) {
    const index = text.indexOf(needle);
    console.log(`${label} @${index}: ${JSON.stringify(text.slice(Math.max(0, index - 60), index + 160))}`);
  }
  fs.writeFileSync(`/tmp/debugDoc-${postId}.html`, html);
  fs.writeFileSync(`/tmp/debugDoc-${postId}.md`, agentMarkdown);
  console.log(`wrote /tmp/debugDoc-${postId}.html and .md`);
  /* eslint-enable no-console */
}

/**
 * Step through the text-index locate pipeline for one quote against one
 * corpus document, printing where the match diverges: the normalized quote,
 * and the document context around the longest quote prefix that still
 * matches. Published posts only.
 */
export async function debugLocate(postId: string, quote: string): Promise<void> {
  /* eslint-disable no-console */
  const corpusDocument = JSON.parse(
    fs.readFileSync(path.join(CORPUS_DIR, `${postId}.json`), "utf8"),
  ) as CorpusDocument;
  const editor = createHeadlessEditor("DebugLocate");
  withDomGlobals(() => hydrateEditorFromYjsBinary(
    editor,
    new Uint8Array(Buffer.from(corpusDocument.yjsStateBase64, "base64")),
  ));

  editor.getEditorState().read(() => {
    const projection = $projectDocumentText();
    const normalizedDocument = normalizeTracked(projection.text);
    const normalizedQuote = normalizeTracked(projectQuoteToRenderedText(quote)).text;

    console.log(`normalized quote: ${JSON.stringify(normalizedQuote.slice(0, 200))}`);
    const exact = normalizedDocument.text.indexOf(normalizedQuote);
    console.log(`exact match index: ${exact}`);
    if (exact !== -1) return;

    // Longest matching prefix of the quote, by binary search.
    let low = 0;
    let high = normalizedQuote.length;
    while (low < high) {
      const mid = Math.ceil((low + high) / 2);
      if (normalizedDocument.text.includes(normalizedQuote.slice(0, mid))) low = mid;
      else high = mid - 1;
    }
    const prefix = normalizedQuote.slice(0, low);
    const at = normalizedDocument.text.indexOf(prefix);
    console.log(`longest matching prefix: ${low}/${normalizedQuote.length} chars`);
    console.log(`quote continues:  ${JSON.stringify(normalizedQuote.slice(Math.max(0, low - 40), low + 60))}`);
    if (at !== -1) {
      console.log(`doc continues:    ${JSON.stringify(normalizedDocument.text.slice(Math.max(0, at + low - 40), at + low + 60))}`);
    }
  });
  /* eslint-enable no-console */
}
