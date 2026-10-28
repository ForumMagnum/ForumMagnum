// EXPERIMENT (branch experiment/iframe-layout-ronny): the AI Futures Model demo post's HTML, built from
// experiments/iframe-layout/ai-futures-model (run its build.py after editing it). No database access,
// so pages can use it directly (see the demo editor page).
import {
  AI_FUTURES_DEMO_POST_HTML, AI_FUTURES_DEMO_WIDGETS,
} from "../../../../experiments/iframe-layout/ai-futures-model/fixture.generated";

export { LAYOUT_DEMO_TITLE } from "@/components/posts/PostsPage/constants";

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
