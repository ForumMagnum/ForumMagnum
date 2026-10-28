// EXPERIMENT (branch experiment/iframe-layout-ronny): the AI Futures Model demo post, which explains
// the model with author-placed iframe widgets so people can try text widths and wrapping.
// The post and widgets come from experiments/iframe-layout/ai-futures-model (run its build.py after
// editing them). The dev database gets reset from time to time, so /experiment-iframe-layout-tuito7fob8u0rzrbib0v16i1 recreates the post
// whenever it's missing (see ensureLayoutDemoPost).
import Posts from "@/server/collections/posts/collection";
import Revisions from "@/server/collections/revisions/collection";
import Users from "@/server/collections/users/collection";
import { createPost } from "@/server/collections/posts/mutations";
import { computeContextFromUser } from "@/server/vulcan-lib/apollo-server/context";
import { LAYOUT_DEMO_TITLE, buildLayoutDemoPostHtml } from "./layoutDemoHtml";

export { LAYOUT_DEMO_TITLE, buildLayoutDemoPostHtml };

// Ronny Fernandez, who wrote the demo.
export const LAYOUT_DEMO_AUTHOR_ID = "NFmcwmaFeTWfgrvBN";

async function contextForAuthor() {
  const user = await Users.findOne({ _id: LAYOUT_DEMO_AUTHOR_ID });
  if (!user) throw new Error(`No user ${LAYOUT_DEMO_AUTHOR_ID}`);
  return computeContextFromUser({ user, isSSR: false });
}

/** Creates the demo as a draft, as the author would. */
export async function createLayoutDemoDraft(): Promise<DbPost> {
  return createPost({
    data: {
      userId: LAYOUT_DEMO_AUTHOR_ID,
      title: LAYOUT_DEMO_TITLE,
      draft: true,
      contents: { originalContents: { type: "html", data: buildLayoutDemoPostHtml() } },
    },
  }, await contextForAuthor());
}

/**
 * Makes the post and its text public without running the new-post callbacks (notifications,
 * emails). The text's revision has to be undrafted too: signed-out readers can't load a draft
 * revision, and the widgets are fetched through it.
 */
async function undraftDirectly(post: DbPost) {
  await Posts.rawUpdateOne({ _id: post._id }, { $set: { draft: false, unlisted: true } });
  if (post.contents_latest) {
    await Revisions.rawUpdateOne({ _id: post.contents_latest, draft: true }, { $set: { draft: false } });
  }
}

/**
 * The shareable demo post: unlisted (viewable by link, signed out too, but in no lists), created as
 * a draft and undrafted if it's missing.
 */
export async function ensureLayoutDemoPost(): Promise<Pick<DbPost, "_id" | "slug">> {
  const existing = await Posts.findOne(
    { userId: LAYOUT_DEMO_AUTHOR_ID, title: LAYOUT_DEMO_TITLE, draft: false, unlisted: true, deletedDraft: false },
    { sort: { postedAt: -1 } },
  );
  if (existing) {
    await undraftDirectly(existing);
    return existing;
  }
  const created = await createLayoutDemoDraft();
  const post = await Posts.findOne({ _id: created._id });
  if (!post) throw new Error(`Demo post ${created._id} vanished`);
  await undraftDirectly(post);
  return post;
}
