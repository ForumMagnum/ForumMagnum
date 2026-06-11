import "./replCssStub";
import fs from "fs";
import path from "path";
import { withDomGlobals } from "@/server/editor/withDomGlobals";
import { createHeadlessEditor } from "../../../../../app/api/agent/editorAgentUtil";
import { hydrateEditorFromYjsBinary } from "../../../../../app/hocuspocusWebhook/yjsToHtml";
import { lexicalEditorToAgentMarkdown } from "../../../../../app/api/agent/agentMarkdownView";
import { CORPUS_DIR, RESULTS_DIR, type CorpusDocument } from "./harnessShared";

interface DocFeatures {
  postId: string
  features: string[]
}

const MULTILINE_LINK_REGEX = /\[[^\]]*\n[^\]]*\]\(/;

function detectFeatures(markdown: string): string[] {
  const features: string[] = [];
  if (/<\/?(ins|del)\b/.test(markdown)) features.push("ins-del-suggestions");
  if (/<(style|script)\b/.test(markdown)) features.push("style-script-html");
  if (/<(iframe|embed|figure|video|audio)\b/.test(markdown)) features.push("embed-html");
  if (MULTILINE_LINK_REGEX.test(markdown)) features.push("multiline-link");
  if (/^>{2,}/m.test(markdown)) features.push("blockquote-runs");
  if (/^\[\^[^\]]+\]:/m.test(markdown)) features.push("footnote-definitions");
  if (/^\+\+\+/m.test(markdown)) features.push("collapsible");
  if (/^\|/m.test(markdown)) features.push("table");
  if (/\$\$|\\\(|\\\[/.test(markdown)) features.push("math");
  if (/^%%%/m.test(markdown)) features.push("llm-block");
  if (/```widget\[/.test(markdown)) features.push("widget");
  if (/<[a-z][a-z0-9-]*(\s|>)/i.test(markdown)) features.push("any-raw-html");
  return features;
}

/**
 * For every document that failed the round-trip invariant in a sweep,
 * regenerate its agent markdown and report which constructs it contains, so
 * the failure population can be characterized at the document level rather
 * than by first-divergence windows. Prints an aggregate table plus one
 * example postId per feature; full per-doc data goes to a JSONL in the
 * results dir.
 */
export async function classifyInvariantFailures({ label }: { label: string }): Promise<void> {
  const failingIds = new Set<string>();
  for (const fileName of fs.readdirSync(RESULTS_DIR)) {
    if (!fileName.startsWith(`invariant-${label}-`) || !fileName.endsWith(".jsonl")) continue;
    const lines = fs.readFileSync(path.join(RESULTS_DIR, fileName), "utf8").split("\n").filter(Boolean);
    for (const line of lines) {
      const record = JSON.parse(line) as { postId: string, equal: boolean };
      if (!record.equal) failingIds.add(record.postId);
    }
  }

  const results: DocFeatures[] = [];
  let processed = 0;
  for (const postId of failingIds) {
    const corpusPath = path.join(CORPUS_DIR, `${postId}.json`);
    if (!fs.existsSync(corpusPath)) continue;
    const corpusDocument = JSON.parse(fs.readFileSync(corpusPath, "utf8")) as CorpusDocument;
    const editor = createHeadlessEditor("ClassifyInvariant");
    withDomGlobals(() => hydrateEditorFromYjsBinary(
      editor,
      new Uint8Array(Buffer.from(corpusDocument.yjsStateBase64, "base64")),
    ));
    const markdown = lexicalEditorToAgentMarkdown(editor);
    results.push({ postId, features: detectFeatures(markdown) });
    processed++;
    if (processed % 50 === 0) {
      // eslint-disable-next-line no-console
      console.log(`classified ${processed}/${failingIds.size}`);
    }
    await new Promise<void>((resolve) => setImmediate(resolve));
  }

  const counts = new Map<string, number>();
  const example = new Map<string, string>();
  let featureless = 0;
  for (const { postId, features } of results) {
    if (features.length === 0) featureless++;
    for (const feature of features) {
      counts.set(feature, (counts.get(feature) ?? 0) + 1);
      if (!example.has(feature)) example.set(feature, postId);
    }
  }

  fs.writeFileSync(
    path.join(RESULTS_DIR, `invariant-features-${label}.jsonl`),
    results.map((result) => JSON.stringify(result)).join("\n") + "\n",
  );

  /* eslint-disable no-console */
  console.log(`\nInvariant-failing docs (${label}): ${results.length}`);
  for (const [feature, count] of [...counts.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(count).padStart(4)} (${((100 * count) / results.length).toFixed(0)}%)  ${feature}  e.g. ${example.get(feature)}`);
  }
  console.log(`  ${String(featureless).padStart(4)} docs with none of the tracked features`);
  /* eslint-enable no-console */
}
