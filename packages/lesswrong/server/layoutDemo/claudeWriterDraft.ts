// EXPERIMENT (branch experiment/iframe-layout-ronny-claude-v1): drafts for the layout demo's "Write with
// Claude" page. Each is a real draft, shared so that anyone with its link can edit it, which is exactly
// what a LessWrong author does to let Claude work on a post through the agent API: the page's editor and
// Claude's API calls then edit the same live (Hocuspocus) document.
import Posts from "@/server/collections/posts/collection";
import Revisions from "@/server/collections/revisions/collection";
import Users from "@/server/collections/users/collection";
import { createPost } from "@/server/collections/posts/mutations";
import { computeContextFromUser } from "@/server/vulcan-lib/apollo-server/context";
import { randomId } from "@/lib/random";
import { constantTimeCompare } from "@/lib/helpers";
import { LAYOUT_DEMO_AUTHOR_ID } from "./aiFuturesLayoutDemo";

export const CLAUDE_WRITER_DRAFT_TITLE = "Untitled draft (written with Claude)";
const STARTER_HTML = "<p>Start writing here, or ask Claude to.</p>";

export interface ClaudeWriterDraft {
  postId: string
  linkSharingKey: string
  title: string
  html: string
}

/**
 * Creates a new draft owned by the demo author, editable by anyone with its link (the sharing setting an
 * author picks before handing the link to Claude). Set directly, since the demo visitor isn't signed in.
 */
export async function createClaudeWriterDraft(): Promise<ClaudeWriterDraft> {
  const author = await Users.findOne({ _id: LAYOUT_DEMO_AUTHOR_ID });
  if (!author) throw new Error(`No user ${LAYOUT_DEMO_AUTHOR_ID}`);
  const post = await createPost({
    data: {
      userId: LAYOUT_DEMO_AUTHOR_ID,
      title: CLAUDE_WRITER_DRAFT_TITLE,
      draft: true,
      contents: { originalContents: { type: "html", data: STARTER_HTML } },
    },
  }, await computeContextFromUser({ user: author, isSSR: false }));
  const linkSharingKey = randomId();
  await Posts.rawUpdateOne({ _id: post._id }, {
    $set: {
      linkSharingKey,
      sharingSettings: { anyoneWithLinkCan: "edit", explicitlySharedUsersCan: "edit" },
    },
  });
  return { postId: post._id, linkSharingKey, title: post.title, html: STARTER_HTML };
}

/** The draft behind a write-page link, or null if it's gone (the dev database gets reset) or the key is wrong. */
export async function getClaudeWriterDraft(postId: string, key: string): Promise<ClaudeWriterDraft | null> {
  const post = await Posts.findOne({ _id: postId, userId: LAYOUT_DEMO_AUTHOR_ID, deletedDraft: false });
  if (!post?.linkSharingKey || !constantTimeCompare({ correctValue: post.linkSharingKey, unknownValue: key })) {
    return null;
  }
  const revision = post.contents_latest ? await Revisions.findOne({ _id: post.contents_latest }) : null;
  return { postId: post._id, linkSharingKey: post.linkSharingKey, title: post.title, html: revision?.html ?? STARTER_HTML };
}
