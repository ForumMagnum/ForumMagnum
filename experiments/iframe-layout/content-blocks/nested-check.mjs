// EXPERIMENT (experiment/iframe-layout-ronny-exp3).
// Widgets inside a quote, a list item, a collapsible section and AI content work like top-level ones (Ronny,
// Oct 29 2026): each has the gear and resize edges (but no grip: it stays in its block), the gear's widths
// and a drag of an edge resize it against that block's text width, and the Post tab shows the result.
// Inside a block a widget only offers the widths that wrap there (Ronny, Oct 29 2026: keep the 300px rule):
// at the normal width a quote, list item or section offers 25/33/38% but not 50%, and an edge pulled past
// 38% goes straight to full width; AI content, as wide as the column, still offers 50%. The offer goes by
// the block's measured width, so it changes with the window.
// Needs the dev server (BASE_URL, default http://localhost:3001, the working copy; 3000 is Ronny's play
// copy, never tested against). Uses the installed Chrome, headless and muted; set PW_CHROMIUM to a Chrome
// binary where there is none (the Studio: Chrome for Testing 156).
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const BASE = process.env.BASE_URL || 'http://localhost:3001';
const ROUTE = '/experiment-widget-blocks-7qunirv1o86fgfg7k1e9bru6e/blocks';
const WIDTH = Number(process.env.W || 1280);
const NARROW = 700;
let failures = 0;
const check = (name, ok, detail) => {
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${!ok && detail !== undefined ? ` :: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}` : ''}`);
};

// As iframeWidgetLayout.ts: a width wraps if it is at least 150px and leaves 300px of text beside it.
const WIDTHS = ['25%', '33%', '38%', '50%'];
const wraps = (width, inner) => {
  const px = Math.round(inner * parseFloat(width) / 100);
  return px >= 150 && inner - px - 32 >= 300;
};

// The nested widgets: key, the block holding it, its text box, the widget's box and layout tag.
const nested = () => {
  const root = document.querySelector('[data-lexical-editor]');
  const kind = (el) => {
    const holder = el.closest('blockquote, li, .detailsBlock, .llm-content-block');
    return !holder ? 'other' : holder.matches('.llm-content-block') ? 'AI content' : holder.matches('.detailsBlock') ? 'section'
      : holder.matches('li') ? 'list item' : 'quote';
  };
  return [...root.querySelectorAll('.iframe-widget-code')].filter(s => s.parentElement !== root).map((s) => {
    const parent = s.parentElement;
    const cs = getComputedStyle(parent);
    const left = parent.getBoundingClientRect().left + parent.clientLeft + parseFloat(cs.paddingLeft);
    const inner = parent.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const key = [...document.querySelectorAll('[data-testid=widget-overlay]')].find(o => {
      const a = o.getBoundingClientRect(), b = s.getBoundingClientRect();
      return Math.abs(a.top - b.top) < 2 && Math.abs(a.left - b.left) < 2;
    })?.dataset.widgetKey;
    const r = s.getBoundingClientRect();
    return { key, in: kind(parent), left, inner, x: r.left, w: r.width, float: getComputedStyle(s).float,
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
  const find = async (key) => (await page.evaluate(nested)).find(w => w.key === key);
  const overlay = key => page.locator(`[data-testid=widget-overlay][data-widget-key="${key}"]`);
  // Opens the gear (picking `pick` if given) and returns the widths it offers; closes it again.
  const gearWidths = async (key, pick) => {
    await overlay(key).scrollIntoViewIfNeeded();
    await overlay(key).hover();
    await page.locator(`[data-testid=widget-options][data-widget-key="${key}"]`).click();
    if (pick) await page.locator(`[data-testid=widget-options-menu] [data-option="${pick}"]`).click();
    await page.waitForTimeout(300);
    const widths = await page.locator('[data-testid=widget-options-menu] [data-option$="%"]').evaluateAll(bs => bs.map(b => b.dataset.option));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(pick ? 1200 : 300);
    return widths;
  };
  // Pulls the widget's text-side edge out to `fraction` of its block's text; returns the ruler's tick
  // labels and the chip's text as seen mid-drag.
  const dragEdge = async (key, fraction) => {
    const now = await find(key);
    const side = now.float;
    await overlay(key).hover();
    const e = await page.locator(`[data-testid=widget-resize-${side === 'left' ? 'right' : 'left'}][data-widget-key="${key}"]`).boundingBox();
    const targetX = side === 'left' ? now.left + fraction * now.inner : now.left + now.inner - fraction * now.inner;
    await page.mouse.move(e.x + e.width / 2, e.y + e.height / 2);
    await page.mouse.down();
    await page.mouse.move(targetX, e.y + e.height / 2, { steps: 12 });
    await page.waitForTimeout(150);
    const seen = await page.evaluate(() => ({
      ticks: [...document.querySelectorAll('[data-testid=widget-resize-tick]')].map(t => t.dataset.label),
      chip: document.querySelector('[data-testid=widget-drag-chip]')?.textContent ?? '',
    }));
    await page.mouse.up();
    await page.waitForTimeout(1200);
    return seen;
  };

  await page.goto(`${BASE}${ROUTE}/editor`, { waitUntil: 'load', timeout: 240000 });
  await page.waitForSelector('[data-lexical-editor] .iframe-widget-code', { timeout: 240000 });
  await page.waitForTimeout(8000);
  const widgets = await page.evaluate(nested);
  check('the demo has widgets in a quote, a list item, a section and AI content',
    ['quote', 'list item', 'section', 'AI content'].every(k => widgets.some(w => w.in === k)) && widgets.every(w => w.key), widgets);

  for (const start of widgets) {
    const label = `${start.in} widget`;
    const has = sel => page.locator(`[data-testid=${sel}][data-widget-key="${start.key}"]`).count();
    check(`${label}: gear and a resize edge, no grip`,
      await has('widget-options') === 1 && (await page.locator(`[data-testid^=widget-resize][data-widget-key="${start.key}"]`).count()) >= 1
      && await has('widget-grip') === 0);

    // The gear offers exactly the widths that wrap against the block's text (25% picked first, so the
    // widget's own width is one of them).
    const offered = await gearWidths(start.key, '25%');
    const expected = WIDTHS.filter(w => wraps(w, start.inner));
    check(`${label}: the gear offers only widths that wrap (${Math.round(start.inner)}px of text: ${expected.join(', ')})`,
      JSON.stringify(offered) === JSON.stringify(expected), { offered, expected });
    let now = await find(start.key);
    check(`${label}: the gear's 25% is a quarter of the block's text`,
      /width=25%/.test(now.tag) && now.float !== 'none' && Math.abs(now.w - 0.25 * now.inner) < 3, now);

    // Pull the text-side edge out to about 38% of the block's text: it snaps to 38%.
    let seen = await dragEdge(start.key, 0.38);
    now = await find(start.key);
    check(`${label}: dragging its edge resizes it against the block (38%)`,
      /width=38%/.test(now.tag) && Math.abs(now.w - 0.38 * now.inner) < 3, now);
    const fits50 = wraps('50%', start.inner);
    check(`${label}: the resize ruler ${fits50 ? 'has' : 'never has'} a 50% mark`, seen.ticks.includes('50%') === fits50, seen);

    // Past 38%: to 50% where that wraps (AI content), else straight to full width; 50% never shows.
    seen = await dragEdge(start.key, 0.56);
    now = await find(start.key);
    if (fits50) {
      check(`${label}: pulled past 38% it snaps to 50%, which wraps here`, /width=50%/.test(now.tag) && now.float !== 'none', { now, seen });
    } else {
      check(`${label}: pulled past 38% it goes straight to full width`,
        !/width=/.test(now.tag) && now.float === 'none' && seen.chip.startsWith('Full width'), { now, seen });
      check(`${label}: no 50% mark or label while resizing`, !seen.ticks.includes('50%') && !/50%/.test(seen.chip), seen);
    }
  }

  // The offer follows the window: AI content offers 50% at the normal width, not in a narrow window.
  const ai = (await page.evaluate(nested)).find(w => w.in === 'AI content');
  if (ai) {
    await gearWidths(ai.key, '33%');
    await page.setViewportSize({ width: NARROW, height: 900 });
    await page.waitForTimeout(1500);
    const narrow = await gearWidths(ai.key);
    const narrowInner = (await find(ai.key)).inner;
    // (Its own 33% stays listed even if it no longer wraps; every other width offered wraps.)
    check(`AI content widget at a ${NARROW}px window (${Math.round(narrowInner)}px of text): no 50%`,
      !narrow.includes('50%') && narrow.filter(w => w !== '33%').every(w => wraps(w, narrowInner)), { narrow, narrowInner });
    await page.setViewportSize({ width: WIDTH, height: 900 });
    await page.waitForTimeout(1500);
    const wide = await gearWidths(ai.key);
    check('AI content widget back at the normal width: 50% again', wide.includes('50%'), wide);
  }

  // The Post tab shows the widths (the editor's edits for this tab).
  await page.waitForTimeout(1500);
  const editor = await page.evaluate(nested);
  await page.goto(`${BASE}${ROUTE}`, { waitUntil: 'load', timeout: 240000 });
  await page.waitForSelector('[data-testid=widget-drag-post-body] iframe', { timeout: 240000 });
  await page.waitForTimeout(5000);
  const post = await page.evaluate(() => {
    const body = document.querySelector('[data-testid=widget-drag-post-body]');
    return [...body.querySelectorAll('.iframe-widget iframe')].filter(f => f.closest('blockquote, li, .detailsBlock, .llm-content-block')).map(f => {
      const holder = f.closest('blockquote, li, .detailsBlock, .llm-content-block');
      const kind = holder.matches('.llm-content-block') ? 'AI content' : holder.matches('.detailsBlock') ? 'section' : holder.matches('li') ? 'list item' : 'quote';
      return { in: kind, w: f.getBoundingClientRect().width, float: getComputedStyle(f).float };
    });
  });
  for (const e of editor) {
    const p = post.find(x => x.in === e.in);
    // A closed section's widget isn't laid out in the post (it hides with the section).
    if (p && p.w > 0) check(`post: the ${e.in} widget has the editor's width`, Math.abs(p.w - e.w) < 3 && p.float === e.float, { editor: e, post: p });
  }
} finally {
  await browser.close();
}
console.log(failures ? `${failures} FAILED` : 'ALL PASSED');
process.exit(failures ? 1 : 0);
