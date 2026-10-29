// EXPERIMENT (experiment/iframe-layout-ronny-exp3): Experiment 3's second demo post, "How content blocks
// behave next to widgets". Unlike the AI Futures post (shared with the earlier experiments, never
// changed), this one is Experiment 3's own: ensureBlocksDemoPost creates it when it's missing (the dev
// database gets reset) and rewrites its text whenever its built HTML changes, so its saved title, word
// count and link previews stay current. Each saved version's fingerprint is its revision's commit message.
import Posts from "@/server/collections/posts/collection";
import Revisions from "@/server/collections/revisions/collection";
import Users from "@/server/collections/users/collection";
import { createPost, updatePost } from "@/server/collections/posts/mutations";
import { computeContextFromUser } from "@/server/vulcan-lib/apollo-server/context";
import { BLOCKS_DEMO_TITLE } from "@/components/posts/PostsPage/widgetBlocksDemo";
import { demoFingerprint } from "@/components/posts/PostsPage/widgetDragEdits";
import { LAYOUT_DEMO_AUTHOR_ID } from "./aiFuturesLayoutDemo";
import { buildBlocksDemoHtml } from "./blocksDemoHtml";

async function contextForAuthor() {
  const user = await Users.findOne({ _id: LAYOUT_DEMO_AUTHOR_ID });
  if (!user) throw new Error(`No user ${LAYOUT_DEMO_AUTHOR_ID}`);
  return computeContextFromUser({ user, isSSR: false });
}

function commitMessageFor(html: string): string {
  return `Experiment 3 demo ${demoFingerprint(html)}`;
}

/** Public and unlisted, without the new-post callbacks; its text's revision is undrafted too. */
async function undraftDirectly(postId: string) {
  const post = await Posts.findOne({ _id: postId });
  if (!post) throw new Error(`Demo post ${postId} vanished`);
  await Posts.rawUpdateOne({ _id: post._id }, { $set: { draft: false, unlisted: true } });
  if (post.contents_latest) {
    await Revisions.rawUpdateOne({ _id: post.contents_latest, draft: true }, { $set: { draft: false } });
  }
  return post;
}

export async function ensureBlocksDemoPost(): Promise<Pick<DbPost, "_id" | "slug">> {
  const html = buildBlocksDemoHtml();
  const commitMessage = commitMessageFor(html);
  const existing = await Posts.findOne(
    { userId: LAYOUT_DEMO_AUTHOR_ID, title: BLOCKS_DEMO_TITLE, draft: false, unlisted: true, deletedDraft: false },
    { sort: { postedAt: -1 } },
  );
  if (existing) {
    const revision = existing.contents_latest ? await Revisions.findOne({ _id: existing.contents_latest }) : null;
    if (revision?.commitMessage !== commitMessage) {
      await updatePost({
        selector: { _id: existing._id },
        data: { contents: { originalContents: { type: "html", data: html }, commitMessage } },
      }, await contextForAuthor());
    }
    return undraftDirectly(existing._id);
  }
  const created = await createPost({
    data: {
      userId: LAYOUT_DEMO_AUTHOR_ID,
      title: BLOCKS_DEMO_TITLE,
      draft: true,
      contents: { originalContents: { type: "html", data: html }, commitMessage },
    },
  }, await contextForAuthor());
  return undraftDirectly(created._id);
}
