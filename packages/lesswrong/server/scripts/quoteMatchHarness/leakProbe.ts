import "./replCssStub";
import fs from "fs";
import path from "path";
import v8 from "v8";
import { $getRoot, $isElementNode, type LexicalEditor, type LexicalNode } from "lexical";
import { $generateHtmlFromNodes } from "@lexical/html";
import { withDomGlobals } from "@/server/editor/withDomGlobals";
import { htmlToMarkdown } from "@/server/editor/conversionUtils";
import { createHeadlessEditor, normalizeText } from "../../../../../app/api/agent/editorAgentUtil";
import { $locateQuoteWithTextIndex } from "../../../../../app/api/agent/textIndexQuoteLocator";
import { hydrateEditorFromYjsBinary } from "../../../../../app/hocuspocusWebhook/yjsToHtml";
import { lexicalEditorToAgentMarkdown } from "../../../../../app/api/agent/agentMarkdownView";
import { CORPUS_DIR, type CorpusDocument } from "./harnessShared";

function forceGc(): void {
  // Available when run with --expose-gc (see the runner command in the
  // function docstring); without it the probe still runs but heap numbers
  // include collectable garbage.
  globalThis.gc?.();
}

function logHeap(label: string, iteration: number): void {
  forceGc();
  // eslint-disable-next-line no-console
  console.log(`${label} iter=${iteration} heapAfterGc=${Math.round(process.memoryUsage().heapUsed / 1e6)}MB`);
}

function loadEditor(postId: string): LexicalEditor {
  const corpusDocument = JSON.parse(
    fs.readFileSync(path.join(CORPUS_DIR, `${postId}.json`), "utf8"),
  ) as CorpusDocument;
  const editor = createHeadlessEditor("LeakProbe");
  withDomGlobals(() => hydrateEditorFromYjsBinary(
    editor,
    new Uint8Array(Buffer.from(corpusDocument.yjsStateBase64, "base64")),
  ));
  return editor;
}

/**
 * Bisection probe for the legacy-locator memory retention: run one pipeline
 * stage repeatedly against a single document and report post-GC heap.
 *
 * Run via:
 *   SKIP_VERCEL_CODE_PULL=1 NODE_OPTIONS='--no-deprecation --expose-gc --max_old_space_size=16000' \
 *     ./node_modules/.bin/ts-node --swc -r tsconfig-paths/register --project tsconfig-repl.json \
 *     scripts/repl.ts dev lw packages/lesswrong/server/scripts/quoteMatchHarness/leakProbe.ts \
 *     "leakProbe('<postId>', '<mode>', 20)"
 */
export async function leakProbe(postId: string, mode: string, iterations = 20): Promise<void> {
  const editor = loadEditor(postId);
  const agentMarkdown = lexicalEditorToAgentMarkdown(editor);
  // A quote from the middle of the document, so locate does realistic work.
  const quote = agentMarkdown.slice(
    Math.floor(agentMarkdown.length / 2),
    Math.floor(agentMarkdown.length / 2) + 200,
  ).trim();

  let wholeDocHtml = "";
  withDomGlobals(() => {
    editor.getEditorState().read(() => {
      wholeDocHtml = $generateHtmlFromNodes(editor, null);
    });
  });
  const wholeDocStateJson = JSON.stringify(editor.getEditorState().toJSON());

  logHeap(mode, -1);
  for (let i = 0; i < iterations; i++) {
    switch (mode) {
      case "locate":
        editor.getEditorState().read(() => {
          $locateQuoteWithTextIndex({
            rootNodeKey: $getRoot().getKey(),
            markdownQuote: quote,
          });
        });
        break;
      case "parseAndSetState": {
        const probeEditor = createHeadlessEditor("LeakProbeInner");
        probeEditor.setEditorState(probeEditor.parseEditorState(wholeDocStateJson));
        break;
      }
      case "generateHtml":
        withDomGlobals(() => {
          editor.getEditorState().read(() => {
            $generateHtmlFromNodes(editor, null);
          });
        });
        break;
      case "turndown":
        htmlToMarkdown(wholeDocHtml);
        break;
      case "turndownSmall":
        htmlToMarkdown(wholeDocHtml.slice(0, 2000));
        break;
      case "createEditorOnly":
        createHeadlessEditor("LeakProbeInner");
        break;
      case "textContentWalk":
        // The filter pass's node-text side without normalization.
        editor.getEditorState().read(() => {
          let total = 0;
          const walk = (node: LexicalNode) => {
            total += node.getTextContent().length;
            if ($isElementNode(node)) {
              for (const child of node.getChildren()) walk(child);
            }
          };
          walk($getRoot());
        });
        break;
      case "stringNormalize":
        // The filter pass's normalization on a document-sized string.
        normalizeText(agentMarkdown);
        break;
      default:
        throw new Error(`Unknown mode: ${mode}`);
    }
    if (process.env.LEAK_PROBE_YIELD) {
      // Yield to the event loop so jsdom's queued DOMContentLoaded promise
      // reactions run; until they do, the microtask queue pins every
      // document created in this loop.
      await new Promise<void>((resolve) => setImmediate(resolve));
    }
    if (i % 5 === 4 || i === iterations - 1) {
      logHeap(mode, i);
    }
  }

  if (process.env.LEAK_PROBE_SNAPSHOT) {
    forceGc();
    // eslint-disable-next-line no-console
    console.log(`snapshot: ${v8.writeHeapSnapshot(`/tmp/leakProbe-${mode}.heapsnapshot`)}`);
  }
}
