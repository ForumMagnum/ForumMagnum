// EXPERIMENT (experiment/iframe-layout-ronny-exp3): Experiment 3's second demo post's HTML, "How content
// blocks behave next to widgets", built from experiments/iframe-layout/content-blocks/demo. No database
// access, so pages can use it directly (see its editor page).
import { BLOCKS_DEMO_POST_HTML } from "../../../../experiments/iframe-layout/content-blocks/demo/blocksDemoSource";
import { AI_FUTURES_DEMO_WIDGETS } from "../../../../experiments/iframe-layout/ai-futures-model/fixture.generated";

function escapeAttribute(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

/** A widget's HTML with its placement tag set to `layout` (for example "position=left width=33%"). */
function placedWidget(html: string, layout: string): string {
  const tag = `<meta name="lw-layout" content="${layout}">`;
  return /<meta\s+name="lw-layout"[^>]*>/.test(html)
    ? html.replace(/<meta\s+name="lw-layout"[^>]*>/, tag)
    : `${tag}\n${html}`;
}

/**
 * The post's HTML, with each <!--widget:name side width [bottom]--> marker swapped for that widget
 * (one of the AI Futures post's widgets), placed as the marker says.
 */
export function buildBlocksDemoHtml(): string {
  return BLOCKS_DEMO_POST_HTML.replace(
    /<!--widget:([\w-]+)(?:\s+(left|right|full))?(?:\s+(\d+%))?(?:\s+(bottom))?-->/g,
    (_match, name: string, side?: string, width?: string, bottom?: string) => {
      const html = AI_FUTURES_DEMO_WIDGETS[name];
      if (!html) throw new Error(`No demo widget named ${name}`);
      const layout = !side || side === 'full'
        ? html.replace(/<meta\s+name="lw-layout"[^>]*>\n?/, '')
        : placedWidget(html, [`position=${side}`, width && `width=${width}`, bottom && 'align=bottom'].filter(Boolean).join(' '));
      return `<iframe data-lexical-iframe-widget="true" sandbox="allow-scripts" srcdoc="${escapeAttribute(layout)}"></iframe>`;
    },
  );
}
