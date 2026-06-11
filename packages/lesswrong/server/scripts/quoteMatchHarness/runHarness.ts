import "./replCssStub";
import fs from "fs";
import path from "path";
import { $getRoot, type LexicalEditor } from "lexical";
import { withDomGlobals } from "@/server/editor/withDomGlobals";
import { createHeadlessEditor } from "../../../../../app/api/agent/editorAgentUtil";
import { lexicalEditorToAgentMarkdown } from "../../../../../app/api/agent/agentMarkdownView";
import { hydrateEditorFromYjsBinary } from "../../../../../app/hocuspocusWebhook/yjsToHtml";
import {
  $locateQuoteWithTextIndex,
  projectQuoteToRenderedText,
} from "../../../../../app/api/agent/textIndexQuoteLocator";
import {
  $projectDocumentText,
  $selectionCoveredText,
  type QuoteLocator,
} from "../../../../../app/api/agent/quoteLocator";
import {
  CORPUS_DIR,
  RECOVERED_QUOTES_FILE,
  RESULTS_DIR,
  harnessCanonicalize,
  type CorpusDocument,
  type RecoveredQuote,
} from "./harnessShared";
import {
  DEFAULT_SELF_QUOTE_OPTIONS,
  createSeededRng,
  generateSelfQuotes,
  splitMarkdownBlocks,
  withPerturbedVariants,
  type GeneratedQuote,
  type SelfQuoteOptions,
} from "./quoteGenerators";

const LOCATORS: Array<{ name: string, locate: QuoteLocator }> = [
  { name: "textIndex", locate: $locateQuoteWithTextIndex },
];

type CaseOutcome =
  // Locator selected a range whose projected text equals the expected text.
  | "matched_expected"
  // Locator selected a range, but its text differs from the expected text.
  | "matched_other_text"
  // Locator reported found, but without a resolvable anchor/focus range.
  | "found_no_range"
  | "not_found"
  | "error";

interface LocatorRun {
  outcome: CaseOutcome
  coveredText?: string
  start?: number
  end?: number
  reason?: string
  ms: number
}

interface HarnessCase {
  postId: string
  /** Aggregation key, e.g. "verbatim:within-block", "perturbed:drop-escapes", "recovered:unattached". */
  category: string
  quote: string
  baseQuote: string | null
  /** Canonicalized expected covered text; null for recovered quotes (no ground truth). */
  expected: string | null
}

interface CaseDetail extends HarnessCase {
  results: Record<string, LocatorRun>
  agreement: string
}

/**
 * Yield to the event loop. Every `new JSDOM()` enqueues a DOMContentLoaded
 * promise reaction; in a fully synchronous loop the microtask queue never
 * drains, so the queued reaction pins every document (and its whole DOM
 * tree) created during the loop — the harness's apparent "memory leak".
 * One macrotask yield per case lets those reactions run and the documents
 * collect. Production code paths await constantly and never accumulate.
 */
function yieldToEventLoop(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

function stripMarkerChars(value: string): string {
  return value.replace(/[*_~^`]/g, "").replace(/\s+/g, " ").trim();
}

function categoryForQuote(quote: GeneratedQuote): string {
  return quote.perturbation === null
    ? `verbatim:${quote.generator}`
    : `perturbed:${quote.perturbation}`;
}

/**
 * Recovered quotes are replayed against the *current* document state, so the
 * category separates the historical outcome (from analytics) from whether
 * the underlying text plausibly still exists (mark presence today).
 */
function categoryForRecoveredQuote(recovered: RecoveredQuote): string {
  if (recovered.analyticsResult === "attached_by_quote_match") {
    return recovered.markPresentInCurrentDoc ? "recovered:attached-extant" : "recovered:attached-gone";
  }
  if (recovered.analyticsResult === "top_level_no_match") {
    return "recovered:no-match";
  }
  return recovered.markPresentInCurrentDoc ? "recovered:unknown-extant" : "recovered:unknown-gone";
}

/**
 * Run one locator against one case inside an editor update, and score the
 * resulting selection by materializing its covered text. The update makes no
 * document changes — locating is read-only — but matches the context the
 * production routes use.
 */
function runLocatorOnCase(
  editor: LexicalEditor,
  locate: QuoteLocator,
  harnessCase: HarnessCase,
): LocatorRun {
  const startTime = performance.now();
  let run: LocatorRun = { outcome: "error", ms: 0 };
  try {
    editor.getEditorState().read(() => {
      const result = locate({
        rootNodeKey: $getRoot().getKey(),
        markdownQuote: harnessCase.quote,
      });
      if (!result.found || !result.anchor || !result.focus) {
        run = {
          outcome: result.found ? "found_no_range" : "not_found",
          reason: result.reason,
          ms: 0,
        };
        return;
      }
      const range = $selectionCoveredText(result.anchor, result.focus);
      if (!range) {
        run = { outcome: "found_no_range", ms: 0 };
        return;
      }
      // Marker-stripped comparison as a second equality check: a quote
      // sliced mid-emphasis leaves unparseable marker fragments in the
      // expected projection (e.g. a dangling `**`) that the document's
      // covered text legitimately lacks. The range is correct when the
      // texts agree with formatting-marker characters removed.
      const canonCovered = harnessCanonicalize(range.text);
      const matchesExpected = harnessCase.expected !== null
        && (canonCovered === harnessCase.expected
          || stripMarkerChars(canonCovered) === stripMarkerChars(harnessCase.expected));
      run = {
        // Recovered quotes have no ground truth; score any located range as
        // matched_expected so the report reads as found/not-found for them.
        outcome: harnessCase.expected === null || matchesExpected
          ? "matched_expected"
          : "matched_other_text",
        coveredText: range.text,
        start: range.start,
        end: range.end,
        ms: 0,
      };
    });
  } catch (error) {
    run = {
      outcome: "error",
      reason: error instanceof Error ? error.message : String(error),
      ms: 0,
    };
  }
  run.ms = performance.now() - startTime;
  return run;
}

function computeAgreement(results: Record<string, LocatorRun>): string {
  const [a, b] = LOCATORS.map(({ name }) => results[name]);
  if (!a || !b) return "single_locator";
  const aFound = a.start !== undefined;
  const bFound = b.start !== undefined;
  if (aFound && bFound) {
    return a.start === b.start && a.end === b.end ? "same_range" : "different_range";
  }
  if (aFound) return `${LOCATORS[0].name}_only`;
  if (bFound) return `${LOCATORS[1].name}_only`;
  return "neither";
}

function loadCorpus(limit: number, offset: number): CorpusDocument[] {
  if (!fs.existsSync(CORPUS_DIR)) {
    throw new Error(`No corpus found at ${CORPUS_DIR} — run fetchQuoteMatchCorpus first.`);
  }
  const files = fs.readdirSync(CORPUS_DIR).filter((name) => name.endsWith(".json")).sort();
  return files.slice(offset, offset + limit).map((name) =>
    JSON.parse(fs.readFileSync(path.join(CORPUS_DIR, name), "utf8")) as CorpusDocument
  );
}

function loadRecoveredQuotesByPost(): Map<string, RecoveredQuote[]> {
  const byPost = new Map<string, RecoveredQuote[]>();
  if (!fs.existsSync(RECOVERED_QUOTES_FILE)) return byPost;
  const lines = fs.readFileSync(RECOVERED_QUOTES_FILE, "utf8").split("\n").filter(Boolean);
  for (const line of lines) {
    const quote = JSON.parse(line) as RecoveredQuote;
    const existing = byPost.get(quote.postId) ?? [];
    existing.push(quote);
    byPost.set(quote.postId, existing);
  }
  return byPost;
}

interface CategoryStats {
  counts: Map<CaseOutcome, number>
  total: number
}

function recordOutcome(
  stats: Map<string, Map<string, CategoryStats>>,
  locatorName: string,
  category: string,
  outcome: CaseOutcome,
): void {
  const byCategory = stats.get(locatorName) ?? new Map<string, CategoryStats>();
  stats.set(locatorName, byCategory);
  const categoryStats = byCategory.get(category) ?? { counts: new Map(), total: 0 };
  byCategory.set(category, categoryStats);
  categoryStats.counts.set(outcome, (categoryStats.counts.get(outcome) ?? 0) + 1);
  categoryStats.total++;
}

function formatCategoryRow(category: string, stats: CategoryStats): string {
  const matched = stats.counts.get("matched_expected") ?? 0;
  const rate = stats.total > 0 ? ((100 * matched) / stats.total).toFixed(1) : "-";
  const breakdown = (["matched_expected", "matched_other_text", "found_no_range", "not_found", "error"] as const)
    .map((outcome) => `${outcome}=${stats.counts.get(outcome) ?? 0}`)
    .join(" ");
  return `    ${category.padEnd(32)} ${String(rate).padStart(5)}%  (${breakdown})`;
}

interface InvariantResult {
  postId: string
  equal: boolean
  /** Index of the first differing character in the canonicalized projections. */
  divergenceIndex?: number
  treeLength: number
  markdownLength: number
  /** Short windows around the divergence — document text, details file only. */
  treeWindow?: string
  markdownWindow?: string
}

// Widget fences embed raw srcdoc HTML in the agent-visible markdown while the
// corresponding iframe node contributes no text to the tree projection, so
// they are excluded from the invariant on the markdown side.
function stripWidgetFences(markdown: string): string {
  return markdown.replace(/```widget\[[^\]]*\][\s\S]*?```/g, "");
}

const DIVERGENCE_WINDOW = 60;

function firstDivergenceIndex(a: string, b: string): number {
  const minLength = Math.min(a.length, b.length);
  for (let i = 0; i < minLength; i++) {
    if (a[i] !== b[i]) return i;
  }
  return minLength;
}

/**
 * The round-trip invariant: the tree-side text projection of the document
 * must equal the rendered text of its agent-visible markdown (modulo
 * canonicalization). This is the single contract the text-index design rests
 * on — anything that survives markdown projection must be findable in the
 * tree projection. A mismatch is either a text-fidelity bug in the
 * Lexical→HTML→Turndown read path or a bug in `$projectDocumentText`; both
 * would otherwise surface as phantom matcher failures, since the projection
 * also scores the locators.
 */
function checkRoundTripInvariant(editor: LexicalEditor, agentMarkdown: string, postId: string): InvariantResult {
  let treeProjection = "";
  editor.getEditorState().read(() => {
    treeProjection = $projectDocumentText().text;
  });
  const treeSide = harnessCanonicalize(treeProjection);
  const markdownSide = harnessCanonicalize(
    projectQuoteToRenderedText(stripWidgetFences(agentMarkdown)),
  );

  if (treeSide === markdownSide) {
    return { postId, equal: true, treeLength: treeSide.length, markdownLength: markdownSide.length };
  }
  const divergenceIndex = firstDivergenceIndex(treeSide, markdownSide);
  const windowStart = Math.max(0, divergenceIndex - (DIVERGENCE_WINDOW / 2));
  return {
    postId,
    equal: false,
    divergenceIndex,
    treeLength: treeSide.length,
    markdownLength: markdownSide.length,
    treeWindow: treeSide.slice(windowStart, divergenceIndex + DIVERGENCE_WINDOW),
    markdownWindow: markdownSide.slice(windowStart, divergenceIndex + DIVERGENCE_WINDOW),
  };
}

/**
 * Run every quote locator against synthetic and recovered quotes over the
 * local corpus snapshot, and print aggregate per-category match rates.
 *
 * Prints only aggregate statistics and post IDs. Full per-case details
 * (including quotes and covered text, which are sensitive user content) are
 * written to a gitignored JSONL file for debugging.
 *
 * Run via: yarn repl dev lw packages/lesswrong/server/scripts/quoteMatchHarness/runHarness.ts "runQuoteMatchHarness({})"
 */
export async function runQuoteMatchHarness({
  limit = 25,
  offset = 0,
  quoteOptions = DEFAULT_SELF_QUOTE_OPTIONS,
  invariantOnly = false,
  locatorNames,
  outputLabel,
}: {
  limit?: number
  /** Skip this many corpus documents (filename order); for chunked sweeps. */
  offset?: number
  quoteOptions?: SelfQuoteOptions
  /** Run only the round-trip invariant check (fast — no locator calls). */
  invariantOnly?: boolean
  /** Restrict to a subset of locators (e.g. ["legacy"]), mainly for debugging. */
  locatorNames?: string[]
  /**
   * Shared label for a chunked sweep: result files are named
   * `results-<label>-<offset>.jsonl` so `summarizeQuoteMatchResults({label})`
   * can aggregate across chunks run in separate processes (the legacy
   * locator leaks memory in-process, so full-corpus sweeps must be chunked).
   */
  outputLabel?: string
}): Promise<void> {
  const activeLocators = locatorNames
    ? LOCATORS.filter(({ name }) => locatorNames.includes(name))
    : LOCATORS;
  const corpus = loadCorpus(limit, offset);
  const recoveredByPost = loadRecoveredQuotesByPost();

  const stats = new Map<string, Map<string, CategoryStats>>();
  const timings = new Map<string, { totalMs: number, calls: number }>();
  const agreementCounts = new Map<string, number>();
  const details: CaseDetail[] = [];
  const invariantResults: InvariantResult[] = [];
  let skippedEmptyDocs = 0;
  let skippedNoExpected = 0;

  for (const corpusDocument of corpus) {
    const binary = new Uint8Array(Buffer.from(corpusDocument.yjsStateBase64, "base64"));
    const editor = createHeadlessEditor("QuoteMatchHarness");
    withDomGlobals(() => hydrateEditorFromYjsBinary(editor, binary));

    let rootChildCount = 0;
    editor.getEditorState().read(() => {
      rootChildCount = $getRoot().getChildrenSize();
    });
    if (rootChildCount === 0) {
      skippedEmptyDocs++;
      continue;
    }

    const agentMarkdown = lexicalEditorToAgentMarkdown(editor);
    invariantResults.push(checkRoundTripInvariant(editor, agentMarkdown, corpusDocument.postId));
    await yieldToEventLoop();
    if (invariantOnly) {
      // eslint-disable-next-line no-console
      console.log(`Checked invariant for ${corpusDocument.postId}`);
      continue;
    }

    const blocks = splitMarkdownBlocks(agentMarkdown);
    const rng = createSeededRng(corpusDocument.postId);
    const syntheticQuotes = withPerturbedVariants(generateSelfQuotes(blocks, rng, quoteOptions));

    const cases: HarnessCase[] = [];
    for (const quote of syntheticQuotes) {
      const expected = harnessCanonicalize(projectQuoteToRenderedText(quote.baseQuote));
      if (!expected) {
        skippedNoExpected++;
        continue;
      }
      cases.push({
        postId: corpusDocument.postId,
        category: categoryForQuote(quote),
        quote: quote.quote,
        baseQuote: quote.baseQuote,
        expected,
      });
    }
    for (const recovered of recoveredByPost.get(corpusDocument.postId) ?? []) {
      cases.push({
        postId: corpusDocument.postId,
        category: categoryForRecoveredQuote(recovered),
        quote: recovered.quote,
        baseQuote: null,
        expected: null,
      });
    }

    for (const harnessCase of cases) {
      const results: Record<string, LocatorRun> = {};
      for (const { name, locate } of activeLocators) {
        const run = runLocatorOnCase(editor, locate, harnessCase);
        results[name] = run;
        recordOutcome(stats, name, harnessCase.category, run.outcome);
        const timing = timings.get(name) ?? { totalMs: 0, calls: 0 };
        timing.totalMs += run.ms;
        timing.calls++;
        timings.set(name, timing);
      }
      const agreement = computeAgreement(results);
      agreementCounts.set(agreement, (agreementCounts.get(agreement) ?? 0) + 1);
      details.push({ ...harnessCase, results, agreement });
      await yieldToEventLoop();
    }

    // eslint-disable-next-line no-console
    console.log(
      `Processed ${corpusDocument.postId}: ${blocks.length} blocks, ${cases.length} cases, `
      + `heap=${Math.round(process.memoryUsage().heapUsed / 1e6)}MB`,
    );
  }

  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  const fileTag = outputLabel !== undefined
    ? `${outputLabel}-${offset}`
    : new Date().toISOString().replace(/[:.]/g, "-");
  const detailsPath = path.join(RESULTS_DIR, `results-${fileTag}.jsonl`);
  fs.writeFileSync(detailsPath, details.map((detail) => JSON.stringify(detail)).join("\n") + "\n");
  const invariantPath = path.join(RESULTS_DIR, `invariant-${fileTag}.jsonl`);
  fs.writeFileSync(
    invariantPath,
    invariantResults.map((result) => JSON.stringify(result)).join("\n") + "\n",
  );
  fs.writeFileSync(
    path.join(RESULTS_DIR, `meta-${fileTag}.json`),
    JSON.stringify({
      docCount: corpus.length,
      skippedEmptyDocs,
      skippedNoExpected,
      caseCount: details.length,
    }),
  );

  const invariantFailures = invariantResults.filter((result) => !result.equal);

  /* eslint-disable no-console */
  console.log("\n=== Quote-locator harness report ===");
  console.log(`Documents: ${corpus.length} (${skippedEmptyDocs} skipped empty)`);
  console.log(
    `Round-trip invariant: ${invariantResults.length - invariantFailures.length}/${invariantResults.length} pass`
    + (invariantFailures.length > 0
      ? `; failing postIds: ${invariantFailures.map((result) => result.postId).join(", ")}`
      : ""),
  );
  if (invariantOnly) {
    console.log(`\nInvariant details (contain document text — treat as sensitive): ${invariantPath}`);
    return;
  }
  console.log(`Cases: ${details.length} (${skippedNoExpected} synthetic quotes skipped: empty projection)`);
  for (const { name } of activeLocators) {
    console.log(`\n  ${name}:`);
    const byCategory = stats.get(name) ?? new Map<string, CategoryStats>();
    const sortedCategories = [...byCategory.entries()].sort(([a], [b]) => a.localeCompare(b));
    for (const [category, categoryStats] of sortedCategories) {
      console.log(formatCategoryRow(category, categoryStats));
    }
    const timing = timings.get(name);
    if (timing && timing.calls > 0) {
      console.log(`    mean locate time: ${(timing.totalMs / timing.calls).toFixed(1)}ms over ${timing.calls} calls`);
    }
  }
  console.log("\n  Agreement:");
  for (const [agreement, count] of [...agreementCounts.entries()].sort()) {
    console.log(`    ${agreement.padEnd(24)} ${count}`);
  }
  console.log(`\nPer-case details (contain document text — treat as sensitive): ${detailsPath}`);
  console.log(`Invariant details (contain document text — treat as sensitive): ${invariantPath}`);
  /* eslint-enable no-console */
}

interface ChunkMeta {
  docCount: number
  skippedEmptyDocs: number
  skippedNoExpected: number
  caseCount: number
}

/**
 * Aggregate and print a combined report from a chunked sweep's result files
 * (see runQuoteMatchHarness's `outputLabel` option).
 *
 * Run via: yarn repl dev lw packages/lesswrong/server/scripts/quoteMatchHarness/runHarness.ts "summarizeQuoteMatchResults({label: 'full1'})"
 */
export async function summarizeQuoteMatchResults({ label }: { label: string }): Promise<void> {
  const fileNames = fs.readdirSync(RESULTS_DIR);
  const matching = (prefix: string, suffix: string) => fileNames
    .filter((name) => name.startsWith(`${prefix}-${label}-`) && name.endsWith(suffix))
    .map((name) => path.join(RESULTS_DIR, name));

  const stats = new Map<string, Map<string, CategoryStats>>();
  const timings = new Map<string, { totalMs: number, calls: number }>();
  const agreementCounts = new Map<string, number>();
  const locatorNames = new Set<string>();
  let caseCount = 0;

  for (const filePath of matching("results", ".jsonl")) {
    const lines = fs.readFileSync(filePath, "utf8").split("\n").filter(Boolean);
    for (const line of lines) {
      const detail = JSON.parse(line) as CaseDetail;
      caseCount++;
      for (const [name, run] of Object.entries(detail.results)) {
        locatorNames.add(name);
        recordOutcome(stats, name, detail.category, run.outcome);
        const timing = timings.get(name) ?? { totalMs: 0, calls: 0 };
        timing.totalMs += run.ms;
        timing.calls++;
        timings.set(name, timing);
      }
      agreementCounts.set(detail.agreement, (agreementCounts.get(detail.agreement) ?? 0) + 1);
    }
  }

  const invariantResults: InvariantResult[] = [];
  for (const filePath of matching("invariant", ".jsonl")) {
    const lines = fs.readFileSync(filePath, "utf8").split("\n").filter(Boolean);
    for (const line of lines) {
      invariantResults.push(JSON.parse(line) as InvariantResult);
    }
  }

  const meta: ChunkMeta = { docCount: 0, skippedEmptyDocs: 0, skippedNoExpected: 0, caseCount: 0 };
  for (const filePath of matching("meta", ".json")) {
    const chunkMeta = JSON.parse(fs.readFileSync(filePath, "utf8")) as ChunkMeta;
    meta.docCount += chunkMeta.docCount;
    meta.skippedEmptyDocs += chunkMeta.skippedEmptyDocs;
    meta.skippedNoExpected += chunkMeta.skippedNoExpected;
    meta.caseCount += chunkMeta.caseCount;
  }

  const invariantFailures = invariantResults.filter((result) => !result.equal);

  /* eslint-disable no-console */
  console.log(`\n=== Quote-locator harness combined report (label: ${label}) ===`);
  console.log(`Documents: ${meta.docCount} (${meta.skippedEmptyDocs} skipped empty)`);
  console.log(
    `Round-trip invariant: ${invariantResults.length - invariantFailures.length}/${invariantResults.length} pass`,
  );
  console.log(`Cases: ${caseCount} (${meta.skippedNoExpected} synthetic quotes skipped: empty projection)`);
  for (const name of [...locatorNames].sort()) {
    console.log(`\n  ${name}:`);
    const byCategory = stats.get(name) ?? new Map<string, CategoryStats>();
    const sortedCategories = [...byCategory.entries()].sort(([a], [b]) => a.localeCompare(b));
    for (const [category, categoryStats] of sortedCategories) {
      console.log(formatCategoryRow(category, categoryStats));
    }
    const timing = timings.get(name);
    if (timing && timing.calls > 0) {
      console.log(`    mean locate time: ${(timing.totalMs / timing.calls).toFixed(1)}ms over ${timing.calls} calls`);
    }
  }
  console.log("\n  Agreement:");
  for (const [agreement, count] of [...agreementCounts.entries()].sort()) {
    console.log(`    ${agreement.padEnd(24)} ${count}`);
  }
  console.log(`\nPer-case and invariant details are under ${RESULTS_DIR} (results/invariant-${label}-*.jsonl)`);
  /* eslint-enable no-console */
}
