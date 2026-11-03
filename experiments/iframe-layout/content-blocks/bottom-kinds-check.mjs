// EXPERIMENT (experiment/iframe-layout-ronny-exp3).
// "You should be able to align top or bottom to any kind of content that can go beside a widget" (Ronny, Nov 2
// 2026). In the blocks demo at 1280px, each section's own widget dragged onto the lower half of:
// - a smaller heading (H3), which starts below the widget's bottom until the widget is pushed down to it;
// - a collapsible section (lined up as it looks open), and then a spoiler past that section;
// lines up with that block's bottom, and the chip names it. On the Post tab, where sections start closed, the
// widget lined up past the section stays where it is when the section is opened or closed, and open, it ends
// at the spoiler's bottom.
// Needs the dev server (BASE_URL, default http://localhost:3001, the working copy; 3000 is Ronny's play copy,
// never tested against). Uses the installed Chrome, headless and muted.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const BASE = process.env.BASE_URL || 'http://localhost:3001';
const POST = '/experiment-widget-blocks-7qunirv1o86fgfg7k1e9bru6e/blocks';
let failures = 0;
const check = (name, ok, detail) => {
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${!ok && detail !== undefined ? ` :: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}` : ''}`);
};

const browser = await chromium.launch({
  ...(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : { channel: 'chrome' }),
  headless: true,
  args: ['--mute-audio'],
});
try {
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message.slice(0, 200)));
  await page.goto(`${BASE}${POST}/editor`, { waitUntil: 'load', timeout: 240000 });
  await page.waitForSelector('[data-testid=widget-overlay]', { state: 'attached', timeout: 240000 });
  // (The demo holds the page at the top for 6s after load.)
  await page.waitForTimeout(7000);
  const frames = (n = 3) => page.evaluate((n) => new Promise(r => { let i = 0; const f = () => (++i >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
  const k = await page.evaluate(() => {
    const root = document.querySelector('[data-lexical-editor]');
    const ed = root.__lexicalEditor;
    const key = `__lexicalKey_${ed._key}`;
    const els = [...root.children];
    return {
      widgets: els.filter(el => el.matches('.iframe-widget-code')).map(el => el[key]),
      h3: els.find(el => /^A heading near the widget's bottom edge/.test(el.textContent.trim()))?.[key],
      section: els.find(el => el.matches('.detailsBlock'))?.[key],
      spoiler: els.find(el => el.matches('.spoilers'))?.[key],
    };
  });
  check('the demo has the blocks and widgets', !!(k.h3 && k.section && k.spoiler) && k.widgets.length >= 3, k);
  const rect = key => page.evaluate(key => { const r = document.querySelector('[data-lexical-editor]').__lexicalEditor.getElementByKey(key).getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom) }; }, key);
  const scrollTo = key => page.evaluate(key => document.querySelector('[data-lexical-editor]').__lexicalEditor.getElementByKey(key).scrollIntoView({ block: 'center' }), key);
  const colLeft = await page.evaluate(() => { const root = document.querySelector('[data-lexical-editor]'); return root.getBoundingClientRect().left + parseFloat(getComputedStyle(root).paddingLeft); });
  /** Drags widget `w` onto the lower half of block `t` (on the left), drops it, and measures both. */
  const dragOnto = async (w, t) => {
    const grip = `[data-testid=widget-grip][data-widget-key="${w}"]`;
    await page.evaluate(sel => document.querySelector(sel)?.scrollIntoView({ block: 'center' }), grip);
    await frames(2);
    const g = await page.evaluate(sel => { const r = document.querySelector(sel).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, grip);
    await page.mouse.move(g.x, g.y);
    await page.mouse.down();
    await page.mouse.move(g.x + 6, g.y, { steps: 2 });
    await scrollTo(t);
    await frames(3);
    let chip = '';
    for (let i = 0; i < 2; i++) {
      const r = await rect(t);
      await page.mouse.move(colLeft + 60, r.bottom - 6, { steps: 8 });
      await frames(4);
      chip = await page.evaluate(() => document.querySelector('[data-testid=widget-drop-indicator]')?.dataset.chip ?? '');
    }
    await page.mouse.up();
    await frames(10);
    await page.waitForTimeout(1500);
    await scrollTo(t);
    await frames(6);
    const layout = await page.evaluate(key => document.querySelector('[data-lexical-editor]').__lexicalEditor.getElementByKey(key).textContent.match(/lw-layout" content="([^"]*)"/)?.[1], w);
    return { chip, layout, widget: await rect(w), target: await rect(t) };
  };
  const linedUp = r => Math.abs(r.widget.bottom - r.target.bottom) <= 3;

  const heading = await dragOnto(k.widgets[1], k.h3);
  check('a smaller heading: the chip says bottom of the heading, and the widget ends at its bottom',
    /bottom of the heading/.test(heading.chip) && /align=bottom span=/.test(heading.layout) && linedUp(heading), heading);
  const section = await dragOnto(k.widgets[2], k.section);
  check('a collapsible section (open in the editor): the chip says bottom of the section, and the widget ends at its bottom',
    /bottom of the section/.test(section.chip) && linedUp(section), section);
  const spoiler = await dragOnto(k.widgets[2], k.spoiler);
  check('a spoiler past that section: the widget ends at its bottom', /bottom of the paragraph/.test(spoiler.chip) && linedUp(spoiler), spoiler);

  // The Post tab starts sections closed: the widget stays put, placed as the section looks open.
  await page.goto(`${BASE}${POST}`, { waitUntil: 'load', timeout: 240000 });
  await page.waitForSelector('[data-testid=widget-drag-post-body] iframe.lwFloatedWidget', { timeout: 240000 });
  await page.waitForTimeout(3000);
  const postState = () => page.evaluate(() => {
    const body = document.querySelector('[data-testid=widget-drag-post-body] .iframe-widget')?.parentElement;
    const details = body?.querySelector(':scope > details.detailsBlock');
    const spoiler = body?.querySelector(':scope > .spoilers, :scope > .spoiler-block');
    // The widget lined up past the section: the last floated one before it.
    let w = details?.previousElementSibling;
    while (w && !w.matches('.iframe-widget')) w = w.previousElementSibling;
    const frame = w?.querySelector('iframe');
    const box = el => { const r = el.getBoundingClientRect(); return { top: Math.round(r.top + scrollY), bottom: Math.round(r.bottom + scrollY) }; };
    return details && spoiler && frame && { open: details.open, widget: box(frame), spoiler: box(spoiler) };
  });
  await page.evaluate(() => document.querySelector('[data-testid=widget-drag-post-body] details.detailsBlock')?.scrollIntoView({ block: 'center' }));
  await frames(8);
  const closed = await postState();
  await page.evaluate(() => { const d = document.querySelector('[data-testid=widget-drag-post-body] details.detailsBlock'); if (d) d.open = true; });
  await frames(10);
  await page.waitForTimeout(500);
  const opened = await postState();
  check('post: the section starts closed, and opening it doesn\'t move the widget', !!closed && !!opened && !closed.open && opened.open
    && Math.abs(opened.widget.top - closed.widget.top) <= 2, { closed, opened });
  check('post: open, the widget ends at the spoiler\'s bottom', !!opened && Math.abs(opened.widget.bottom - opened.spoiler.bottom) <= 3, opened);

  check('no page errors', errors.length === 0, errors);
} finally {
  await browser.close();
}
console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
process.exit(failures ? 1 : 0);
