// EXPERIMENT (branch experiment/iframe-layout-ronny): creates or re-renders the AI Futures Model demo
// post (see server/layoutDemo/aiFuturesLayoutDemo.ts). Build the widgets first
// (experiments/iframe-layout/ai-futures-model/build.py), then for example:
//   SKIP_VERCEL_CODE_PULL=true yarn repl dev lw packages/lesswrong/scripts/iframeLayoutDemoDraft.ts "createIframeLayoutDraft()"
// The shareable, self-healing version is the /experiment-iframe-layout-tuito7fob8u0rzrbib0v16i1 link.
import { updatePost } from "@/server/collections/posts/mutations";
import Users from "@/server/collections/users/collection";
import { computeContextFromUser } from "@/server/vulcan-lib/apollo-server/context";
import {
  LAYOUT_DEMO_AUTHOR_ID, buildLayoutDemoPostHtml, createLayoutDemoDraft, ensureLayoutDemoPost,
} from "@/server/layoutDemo/aiFuturesLayoutDemo";

/** Re-renders an existing demo post from the current post.html and widgets. */
export async function updateIframeLayoutDraft(postId: string) {
  const user = await Users.findOne({ _id: LAYOUT_DEMO_AUTHOR_ID });
  if (!user) throw new Error(`No user ${LAYOUT_DEMO_AUTHOR_ID}`);
  const context = await computeContextFromUser({ user, isSSR: false });
  await updatePost({
    selector: { _id: postId },
    data: { contents: { originalContents: { type: "html", data: buildLayoutDemoPostHtml() } } },
  }, context);
  // eslint-disable-next-line no-console
  console.log(`Updated ${postId}`);
}

/** Creates a private draft of the demo. */
export async function createIframeLayoutDraft() {
  const post = await createLayoutDemoDraft();
  // eslint-disable-next-line no-console
  console.log(`Created draft ${post._id}: http://localhost:3000/posts/${post._id}/${post.slug}`);
  return post._id;
}

/** Creates the unlisted, shareable demo post if it's missing (same as visiting /experiment-iframe-layout-tuito7fob8u0rzrbib0v16i1). */
export async function ensureIframeLayoutDemo() {
  const post = await ensureLayoutDemoPost();
  // eslint-disable-next-line no-console
  console.log(`Demo post ${post._id}: http://localhost:3000/posts/${post._id}/${post.slug}`);
  return post._id;
}
