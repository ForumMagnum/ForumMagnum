/* eslint-disable no-console */
import { writeFile } from "fs/promises";
import Posts from "@/server/collections/posts/collection";
import Revisions from "@/server/collections/revisions/collection";
import { buildNarrationScript, getNarrationSegmentText, getPostIntroduction } from "@/server/narration/narrationScript";

/**
 * Writes out the text that would be sent to the speech model for a post,
 * segment by segment, without generating any audio or storing the script. For
 * checking changes to narration preprocessing. Descriptions of the post's
 * images are stored if they hadn't been described before, as they are when a
 * script is built for real.
 *
 * npm run repl -- dev lw packages/lesswrong/scripts/previewNarrationScript.ts 'previewNarrationScript("<postId>", "/tmp/narration.txt")'
 */
export async function previewNarrationScript(postId: string, outputPath: string) {
  const post = await Posts.findOne({ _id: postId });
  if (!post?.contents_latest) {
    throw new Error(`Post ${postId} not found, or it has no contents`);
  }
  const revision = await Revisions.findOne({ _id: post.contents_latest });
  if (!revision?.html) {
    throw new Error(`Revision ${post.contents_latest} has no html`);
  }

  const { script, segments } = await buildNarrationScript(revision.html, {
    introduction: getPostIntroduction(post.title, [post.author ?? "the author"]),
    postTitle: post.title,
  });
  const segmentTexts = segments.map((segment, segmentIndex) => {
    const text = getNarrationSegmentText(script.blocks.slice(segment.startBlockIndex, segment.endBlockIndex));
    return `===== Segment ${segmentIndex} (${segment.characterCount} characters) =====\n${text}`;
  });
  await writeFile(outputPath, segmentTexts.join("\n\n"));
  console.log(`${script.blocks.length} blocks in ${segments.length} segments; written to ${outputPath}`);
}
