// EXPERIMENT (branch experiment/iframe-layout-ronny): creates a local dev-db draft that explains
// the AI Futures Model with author-placed iframe widgets, for trying out iframe width and text wrap.
// Build the widgets first (experiments/iframe-layout/ai-futures-model/build.py), then:
//   SKIP_VERCEL_CODE_PULL=true yarn repl dev lw packages/lesswrong/scripts/iframeLayoutDemoDraft.ts "createIframeLayoutDraft('<userId>')"
import fs from "fs";
import path from "path";
import Users from "@/server/collections/users/collection";
import { createPost, updatePost } from "@/server/collections/posts/mutations";
import { computeContextFromUser } from "@/server/vulcan-lib/apollo-server/context";

const DEMO_DIR = path.join(process.cwd(), "experiments/iframe-layout/ai-futures-model");

function escapeAttribute(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function widgetIframe(name: string): string {
  const srcdoc = fs.readFileSync(path.join(DEMO_DIR, "out", `${name}.html`), "utf-8");
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
 * post.html, with each <!--widget:name--> marker swapped for that widget and each {{fn:text}}
 * marker swapped for a footnote in LessWrong's own footnote markup (so it shows as a sidenote).
 */
function buildPostHtml(): string {
  const footnotes: string[] = [];
  const body = fs.readFileSync(path.join(DEMO_DIR, "post.html"), "utf-8")
    .replace(/<!--widget:([\w-]+)-->/g, (_match, name: string) => widgetIframe(name))
    .replace(/\{\{fn:([^}]+)\}\}/g, (_match, text: string) => {
      footnotes.push(text.trim());
      return footnoteReference(`aifm${footnotes.length}`, footnotes.length);
    });
  if (!footnotes.length) return body;
  const items = footnotes.map((text, i) => footnoteItem(`aifm${i + 1}`, i + 1, text)).join("");
  return `${body}\n<ol data-footnote-section="" role="doc-endnotes" class="footnote-section footnotes">${items}</ol>`;
}

/** Re-renders an existing demo draft from the current post.html and widgets. */
export async function updateIframeLayoutDraft(postId: string, userId: string) {
  const user = await Users.findOne({ _id: userId });
  if (!user) throw new Error(`No user ${userId}`);
  const context = await computeContextFromUser({ user, isSSR: false });
  await updatePost({
    selector: { _id: postId },
    data: { contents: { originalContents: { type: "html", data: buildPostHtml() } } },
  }, context);
  // eslint-disable-next-line no-console
  console.log(`Updated draft ${postId}`);
}

/** Creates the draft from post.html (see buildPostHtml). */
export async function createIframeLayoutDraft(userId: string) {
  const user = await Users.findOne({ _id: userId });
  if (!user) throw new Error(`No user ${userId}`);
  const html = buildPostHtml();

  const context = await computeContextFromUser({ user, isSSR: false });
  const post = await createPost({
    data: {
      userId,
      title: "The AI Futures Model, explained with interactive widgets",
      draft: true,
      contents: { originalContents: { type: "html", data: html } },
    },
  }, context);
  // eslint-disable-next-line no-console
  console.log(`Created draft ${post._id}: http://localhost:3000/posts/${post._id}/${post.slug}`);
  return post._id;
}
