// EXPERIMENT (experiment/iframe-layout-ronny-exp3).
// Widgets inside a quote, a list item and a collapsible section work like top-level ones (Ronny, Oct 29
// 2026): each has the gear and resize edges (but no grip: it stays in its block), the gear's widths and a
// drag of an edge resize it against that block's text width, and the Post tab shows the result.
// Needs the dev server (BASE_URL, default http://localhost:3000). Uses the installed Chrome, headless and
// muted; set PW_CHROMIUM to a Chrome binary where there is none (the Studio: Chrome for Testing 156).
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const ROUTE = '/experiment-widget-blocks-7qunirv1o86fgfg7k1e9bru6e/blocks';
const WIDTH = Number(process.env.W || 1280);
let failures = 0;
const check = (name, ok, detail) => {
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${!ok && detail !== undefined ? ` :: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}` : ''}`);
};

// The nested widgets: key, container, its text box, the widget's box and layout tag.
const nested = () => {
  const root = document.querySelector('[data-lexical-editor]');
  return [...root.querySelectorAll('.iframe-widget-code')].filter(s => s.parentElement !== root).map((s) => {
    const parent = s.parentElement;
    const cs = getComputedStyle(parent);
    const left = parent.getBoundingClientRect().left + parent.clientLeft + parseFloat(cs.paddingLeft);
    const inner = parent.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const key = [...document.querySelectorAll('[data-testid=widget-overlay]')].find(o => {
      const a = o.getBoundingClientRect(), b = s.getBoundingClientRect();
      return Math.abs(a.top - b.top) < 2 && Math.abs(a.left - b.left) < 2;
    })?.dataset.widgetKey;
    const container = parent.closest('blockquote, li, .detailsBlock');
    const r = s.getBoundingClientRect();
    return { key, in: container?.tagName ?? parent.tagName, left, inner, x: r.left, w: r.width, float: getComputedStyle(s).float,
      tag: (s.textContent.match(/<meta name="lw-layout" content="([^"]*)"/) || [])[1] || '' };
  });
};

const browser = await chromium.launch({
  ...(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : { channel: 'chrome' }),
  headless: true,
  args: ['--mute-audio'],
});
try {
  const page = await (await browser.newContext({ viewport: { width: WIDTH, height: 900 } })).newPage();
  await page.goto(`${BASE}${ROUTE}/editor`, { waitUntil: 'load', timeout: 240000 });
  await page.waitForSelector('[data-lexical-editor] .iframe-widget-code', { timeout: 240000 });
  await page.waitForTimeout(8000);
  let widgets = await page.evaluate(nested);
  check('the demo has widgets in a quote, a list item and a section',
    ['BLOCKQUOTE', 'LI', 'DIV'].every(t => widgets.some(w => w.in === t)) && widgets.every(w => w.key), widgets);

  for (const start of widgets) {
    const label = `${start.in.toLowerCase()} widget`;
    const has = sel => page.locator(`[data-testid=${sel}][data-widget-key="${start.key}"]`).count();
    check(`${label}: gear and a resize edge, no grip`,
      await has('widget-options') === 1 && (await page.locator(`[data-testid^=widget-resize][data-widget-key="${start.key}"]`).count()) >= 1
      && await has('widget-grip') === 0);

    // The gear's 25%: a quarter of the block's text, still beside it.
    const overlay = page.locator(`[data-testid=widget-overlay][data-widget-key="${start.key}"]`);
    await overlay.scrollIntoViewIfNeeded();
    await overlay.hover();
    await page.locator(`[data-testid=widget-options][data-widget-key="${start.key}"]`).click();
    await page.locator('[data-testid=widget-options-menu] [data-option="25%"]').click();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1200);
    let now = (await page.evaluate(nested)).find(w => w.key === start.key);
    check(`${label}: the gear's 25% is a quarter of the block's text`,
      /width=25%/.test(now.tag) && now.float !== 'none' && Math.abs(now.w - 0.25 * now.inner) < 3, now);

    // Pull the text-side edge out to about 38% of the block's text: it snaps to 38%.
    const side = now.float;
    const edge = page.locator(`[data-testid=widget-resize-${side === 'left' ? 'right' : 'left'}][data-widget-key="${start.key}"]`);
    await overlay.hover();
    const e = await edge.boundingBox();
    const targetX = side === 'left' ? now.left + 0.38 * now.inner : now.left + now.inner - 0.38 * now.inner;
    await page.mouse.move(e.x + e.width / 2, e.y + e.height / 2);
    await page.mouse.down();
    await page.mouse.move(targetX, e.y + e.height / 2, { steps: 10 });
    await page.waitForTimeout(150);
    await page.mouse.up();
    await page.waitForTimeout(1200);
    now = (await page.evaluate(nested)).find(w => w.key === start.key);
    check(`${label}: dragging its edge resizes it against the block (38%)`,
      /width=38%/.test(now.tag) && Math.abs(now.w - 0.38 * now.inner) < 3, now);
  }

  // The Post tab shows the widths (the editor's edits for this tab).
  await page.waitForTimeout(1500);
  const editor = await page.evaluate(nested);
  await page.goto(`${BASE}${ROUTE}`, { waitUntil: 'load', timeout: 240000 });
  await page.waitForSelector('[data-testid=widget-drag-post-body] iframe', { timeout: 240000 });
  await page.waitForTimeout(5000);
  const post = await page.evaluate(() => {
    const body = document.querySelector('[data-testid=widget-drag-post-body]');
    return [...body.querySelectorAll('blockquote .iframe-widget iframe, li .iframe-widget iframe, .detailsBlock .iframe-widget iframe')]
      .map(f => ({ in: f.closest('blockquote, li, .detailsBlock').tagName, w: f.getBoundingClientRect().width, float: getComputedStyle(f).float }));
  });
  for (const e of editor) {
    const p = post.find(x => x.in === (e.in === 'DIV' ? 'DETAILS' : e.in));
    // A closed section's widget isn't laid out in the post (it hides with the section).
    if (p && p.w > 0) check(`post: the ${e.in.toLowerCase()} widget has the editor's width`, Math.abs(p.w - e.w) < 3 && p.float === e.float, { editor: e, post: p });
  }
} finally {
  await browser.close();
}
console.log(failures ? `${failures} FAILED` : 'ALL PASSED');
process.exit(failures ? 1 : 0);
