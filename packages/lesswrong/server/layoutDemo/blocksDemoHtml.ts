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
 * A plain demo widget: a title and a small bar chart, `height` px tall. Fully clear, as for every widget: no
 * background and no outline (Ronny, Oct 29 2026; the outline's right edge also looked cut off, falling on a
 * fraction of a pixel). (It can't say where it is placed: the editor shows widgets without their placement tag.)
 */
function demoWidget(layout: string, height: number): string {
  const bars = [40, 70, 55, 90, 65].map((h, i) => `<rect x="${6 + (i * 19)}" y="${100 - h}" width="13" height="${h}" rx="1.5"/>`).join('');
  return [
    layout ? `<meta name="lw-layout" content="${layout}">` : '',
    '<style>',
    'body{margin:0;font:13px/1.35 system-ui,-apple-system,"Segoe UI",sans-serif;color:#2e6a4b}',
    `.w{box-sizing:border-box;height:${height}px;display:flex;flex-direction:column}`,
    '.t{font-weight:600}',
    'svg{flex:1;min-height:0;width:100%;margin-top:8px}rect{fill:#5f9b7a;opacity:.7}',
    '@media (prefers-color-scheme: dark){body{color:#9fd3b4}rect{fill:#7fbf9a}}',
    '</style>',
    `<div class="w"><div class="t">Demo widget</div><svg viewBox="0 0 100 100" preserveAspectRatio="none">${bars}</svg></div>`,
  ].join('\n');
}

/**
 * The post's HTML, with each <!--widget:name side width [bottom]--> marker swapped for that widget
 * (one of the AI Futures post's widgets), placed as the marker says, and each <!--demo:side width [hN]
 * [bottom]--> marker for a plain demo widget (side: left, right, center or full; N: its height in px).
 */
export function buildBlocksDemoHtml(): string {
  return BLOCKS_DEMO_POST_HTML.replace(
    /<!--demo:(left|right|center|full)(?:\s+(\d+%))?(?:\s+h(\d+))?(?:\s+(bottom))?-->/g,
    (_match, side: string, width?: string, height?: string, bottom?: string) => {
      const layout = side === 'full' ? ''
        : [`position=${side}`, width && `width=${width}`, bottom && 'align=bottom'].filter(Boolean).join(' ');
      return `<iframe data-lexical-iframe-widget="true" sandbox="allow-scripts" srcdoc="${escapeAttribute(demoWidget(layout, Number(height ?? 220)))}"></iframe>`;
    },
  ).replace(
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
