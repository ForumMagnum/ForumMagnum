import fs from "fs";
import { Posts } from "@/server/collections/posts/collection";
import { createAdminContext } from "@/server/vulcan-lib/createContexts";
import { executePromiseQueue } from "@/lib/utils/asyncUtils";
import { AUTO_TAG_SLUGS, type AutoTagDecisions, type AutoTagSlug, classifyAutoTags } from "@/server/languageModels/autoTagCallbacks";

/* eslint-disable no-console */

/**
 * Run the auto-tagger on posts with known core-tag labels, and report precision
 * and recall per tag along with every disagreement and the model's reason.
 *
 * The labels file is a JSON array of {postId, labels}, where labels maps
 * core-tag slugs to booleans. Tags missing from a post's labels aren't scored.
 *
 * Usage:
 *   yarn repl dev lw packages/lesswrong/scripts/autoTagEval.ts "autoTagEval('/path/labels.json', '/path/results.jsonl')"
 */

const CONCURRENCY = 8;

interface LabeledPost {
  postId: string;
  labels: Partial<Record<AutoTagSlug, boolean>>;
}

interface EvalResult {
  postId: string;
  title: string;
  labels: Partial<Record<AutoTagSlug, boolean>>;
  decisions: AutoTagDecisions | null;
  error: string | null;
}

interface Disagreement {
  kind: "false positive" | "false negative";
  result: EvalResult;
  reason: string;
}

function printTagSummary(slug: AutoTagSlug, results: EvalResult[]) {
  const scored = results.flatMap(({ labels, decisions }) => {
    const label = labels[slug];
    return label === undefined || !decisions ? [] : [{ label, predicted: decisions[slug].applies }];
  });
  const truePositives = scored.filter(({ label, predicted }) => label && predicted).length;
  const falsePositives = scored.filter(({ label, predicted }) => !label && predicted).length;
  const falseNegatives = scored.filter(({ label, predicted }) => label && !predicted).length;
  const precision = truePositives / (truePositives + falsePositives);
  const recall = truePositives / (truePositives + falseNegatives);
  console.log(`${slug.padEnd(20)} n=${scored.length}  labeled yes=${truePositives + falseNegatives}  `
    + `predicted yes=${truePositives + falsePositives}  precision=${precision.toFixed(3)}  recall=${recall.toFixed(3)}`);
}

function getDisagreements(slug: AutoTagSlug, results: EvalResult[]): Disagreement[] {
  return results.flatMap((result): Disagreement[] => {
    const label = result.labels[slug];
    if (label === undefined || !result.decisions) return [];
    const { applies, reason } = result.decisions[slug];
    if (label === applies) return [];
    return [{ kind: applies ? "false positive" : "false negative", result, reason }];
  });
}

export async function autoTagEval(labelsPath: string, outputPath: string) {
  const labeledPosts: LabeledPost[] = JSON.parse(fs.readFileSync(labelsPath, "utf8"));
  const context = createAdminContext({ forumType: "LessWrong" });
  const posts = await Posts.find({ _id: { $in: labeledPosts.map(({ postId }) => postId) } }).fetch();
  const postsById = new Map(posts.map(post => [post._id, post]));
  const postsToClassify = labeledPosts.map(({ postId, labels }) => {
    const post = postsById.get(postId);
    if (!post) throw new Error(`Post not found: ${postId}`);
    return { postId, labels, post };
  });

  console.log(`Classifying ${labeledPosts.length} posts...`);
  let completed = 0;
  const results = await executePromiseQueue(postsToClassify.map(({ postId, labels, post }) => async (): Promise<EvalResult> => {
    try {
      const decisions = await classifyAutoTags(post, context);
      return { postId, title: post.title, labels, decisions, error: null };
    } catch (err) {
      return { postId, title: post.title, labels, decisions: null, error: err instanceof Error ? err.message : String(err) };
    } finally {
      completed++;
      if (completed % 25 === 0) console.log(`${completed}/${labeledPosts.length} classified`);
    }
  }), CONCURRENCY);

  fs.writeFileSync(outputPath, results.map(result => JSON.stringify(result)).join("\n") + "\n");

  for (const { postId, title, error } of results.filter(({ error }) => error)) {
    console.log(`ERROR ${title} (${postId}): ${error}`);
  }
  for (const slug of AUTO_TAG_SLUGS) {
    for (const { kind, result, reason } of getDisagreements(slug, results)) {
      console.log(`[${slug} ${kind}] ${result.title} (${result.postId}): ${reason}`);
    }
  }
  for (const slug of AUTO_TAG_SLUGS) {
    printTagSummary(slug, results);
  }
  console.log(`Wrote ${results.length} results to ${outputPath}`);
}
