// EXPERIMENT (branch experiment/iframe-layout-ronny): the AI Futures Model demo post, which explains
// the model with author-placed iframe widgets so people can try text widths and wrapping.
// The post and widgets come from experiments/iframe-layout/ai-futures-model (run its build.py after
// editing them). The dev database gets reset from time to time, so /layout-demo recreates the post
// whenever it's missing (see ensureLayoutDemoPost).
import Posts from "@/server/collections/posts/collection";
import Revisions from "@/server/collections/revisions/collection";
import Users from "@/server/collections/users/collection";
import { createPost } from "@/server/collections/posts/mutations";
import { computeContextFromUser } from "@/server/vulcan-lib/apollo-server/context";
import {
  AI_FUTURES_DEMO_POST_HTML, AI_FUTURES_DEMO_WIDGETS,
} from "../../../../experiments/iframe-layout/ai-futures-model/fixture.generated";

export const LAYOUT_DEMO_TITLE = "The AI Futures Model, explained with interactive widgets";
// Ronny Fernandez, who wrote the demo.
export const LAYOUT_DEMO_AUTHOR_ID = "NFmcwmaFeTWfgrvBN";

function escapeAttribute(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function widgetIframe(name: string): string {
  const srcdoc = AI_FUTURES_DEMO_WIDGETS[name];
  if (!srcdoc) throw new Error(`No demo widget named ${name}`);
  return `<iframe data-lexical-iframe-widget="true" sandbox="allow-scripts" srcdoc="${escapeAttribute(srcdoc)}"></iframe>`;
}

function footnoteReference(id: string, index: number): string {
  return `<span data-footnote-reference="" data-footnote-id="${id}" data-footnote-index="${index}" role="doc-noteref" id="fnref${id}" class="footnote-reference"><sup><a href="#fn${id}">[${index}]</a></sup></span>`;
}

function footnoteItem(id: string, index: number, text: string): string {
  return `<li data-footnote-item="" data-footnote-id="${id}" data-footnote-index="${index}" role="doc-endnote" id="fn${id}" class="footnote-item">`
    + `<span data-footnote-back-link="" data-footnote-id="${id}" class="footnote-back-link"><sup><strong><a href="#fnref${id}">^</a></strong></sup></span>`
    + `<div data-footnote-content="" class="footnote-content"><p>${text}</p></div></li>`;
}

/**
 * The post's HTML, with each <!--widget:name--> marker swapped for that widget and each {{fn:text}}
 * marker swapped for a footnote in LessWrong's own footnote markup (so it shows as a sidenote).
 */
export function buildLayoutDemoPostHtml(): string {
  const footnotes: string[] = [];
  const body = AI_FUTURES_DEMO_POST_HTML
    .replace(/<!--widget:([\w-]+)-->/g, (_match, name: string) => widgetIframe(name))
    .replace(/\{\{fn:([^}]+)\}\}/g, (_match, text: string) => {
      footnotes.push(text.trim());
      return footnoteReference(`aifm${footnotes.length}`, footnotes.length);
    });
  if (!footnotes.length) return body;
  const items = footnotes.map((text, i) => footnoteItem(`aifm${i + 1}`, i + 1, text)).join("");
  return `${body}\n<ol data-footnote-section="" role="doc-endnotes" class="footnote-section footnotes">${items}</ol>`;
}

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
