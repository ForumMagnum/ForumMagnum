// EXPERIMENT (experiment/iframe-layout-ronny-exp3).
// A drag the way a person does it: press the grip, move the mouse down in small steps, no scripted scrolling
// (Ronny, Nov 3 2026: "I cannot drag the 5 milestones widget to be aligned with the bottom of the second
// paragraph"; every earlier check jumped the mouse straight to the spot, so none of them caught it). In a laptop
// sized window (1440x780), for the AI Futures demo's 525px milestones widget and the blocks demo's first widget:
// - a small move changes nothing;
// - moving the widget until its bottom reaches the paragraph's offers "bottom of the paragraph" with the ghost
//   ending there, well before the mouse reaches the auto-scroll zone (the page hasn't scrolled);
// - the drop lines it up: its bottom ends inside the paragraph's last line.
// Needs the dev server (BASE_URL, default http://localhost:3001, the working copy; 3000 is Ronny's play copy,
// never tested against). Uses the installed Chrome, headless and muted.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const BASE = process.env.BASE_URL || 'http://localhost:3001';
const ROUTE = '/experiment-widget-blocks-7qunirv1o86fgfg7k1e9bru6e';
const WIDTH = 1440;
const HEIGHT = 780;
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

/** One drag: `first` starts the paragraph the widget sits before, `target` the one to line up with. */
const run = async (label, path, heading, first, target) => {
  const page = await (await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message.slice(0, 200)));
  await page.goto(`${BASE}${path}`, { waitUntil: 'load', timeout: 240000 });
  await page.waitForSelector('[data-testid=widget-overlay]', { state: 'attached', timeout: 240000 });
  await page.waitForTimeout(7000);
  const frames = (n = 3) => page.evaluate((n) => new Promise(r => { let i = 0; const f = () => (++i >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
  const k = await page.evaluate(([heading, first, target]) => {
    const root = document.querySelector('[data-lexical-editor]');
    const ed = root.__lexicalEditor;
    const key = `__lexicalKey_${ed._key}`;
    const els = [...root.children];
    const find = start => els.find(el => el.textContent.trim().replace(/^Claude Opus 5\.5\s*/, '').startsWith(start));
    const p = find(first);
    let w = p?.previousElementSibling;
    while (w && !w.matches('.iframe-widget-code')) w = w.previousElementSibling;
    return { heading: find(heading)?.[key], first: p?.[key], target: find(target)?.[key], widget: w?.[key] };
  }, [heading, first, target]);
  check(`${label}: the demo has the section and its widget`, !!(k.heading && k.first && k.target && k.widget), k);
  // Scrolled as a person would: the section heading near the top of the window.
  await page.evaluate((key) => { window.scrollBy(0, document.querySelector('[data-lexical-editor]').__lexicalEditor.getElementByKey(key).getBoundingClientRect().top - 90); }, k.heading);
  await frames(6);
  const rect = key => page.evaluate((key) => { const r = document.querySelector('[data-lexical-editor]').__lexicalEditor.getElementByKey(key).getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom) }; }, key);
  const read = () => page.evaluate(() => {
    const ghost = document.querySelector('[data-testid=widget-drop-ghost]')?.getBoundingClientRect();
    return { chip: document.querySelector('[data-testid=widget-drop-indicator]')?.dataset.chip ?? '', ghostTop: ghost ? Math.round(ghost.top) : null, ghostBottom: ghost ? Math.round(ghost.bottom) : null, scrollY: Math.round(window.scrollY) };
  });
  const scrollStart = await page.evaluate(() => Math.round(window.scrollY));
  const before = await rect(k.widget);
  const goal = await rect(k.target);
  const grip = `[data-testid=widget-grip][data-widget-key="${k.widget}"]`;
  const g = await page.evaluate((sel) => { const r = document.querySelector(sel).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, grip);
  await page.mouse.move(g.x, g.y);
  await page.mouse.down();
  await page.mouse.move(g.x + 1, g.y + 6, { steps: 2 });
  await frames(3);
  const small = await read();
  check(`${label}: a small move changes nothing`, /No change/.test(small.chip), small);
  // Down in small steps, until it offers the bottom of the paragraph with the ghost ending there.
  let found = null;
  let y = g.y + 6;
  while (!found && y < g.y + 400 && y < HEIGHT - 120) {
    y += 4;
    await page.mouse.move(g.x, y, { steps: 1 });
    await frames(2);
    const s = await read();
    if (/bottom of the paragraph/.test(s.chip) && s.ghostBottom !== null && Math.abs(s.ghostBottom - goal.bottom) <= 3) found = { ...s, moved: Math.round(y - g.y) };
  }
  const wanted = goal.bottom - before.bottom;
  check(`${label}: moved about as far as the widget has to go (${wanted}px), it offers the paragraph's bottom, ghost ending there`,
    !!found && found.moved <= Math.max(wanted, 0) + 60, found ?? await read());
  check(`${label}: the page hasn't scrolled by then`, !!found && found.scrollY === scrollStart, { found, scrollStart });
  await page.mouse.up();
  await frames(10);
  await page.waitForTimeout(1200);
  await frames(4);
  const layout = await page.evaluate(key => document.querySelector('[data-lexical-editor]').__lexicalEditor.getElementByKey(key).textContent.match(/lw-layout" content="([^"]*)"/)?.[1], k.widget);
  const w = await rect(k.widget);
  const t = await rect(k.target);
  const lineHeight = await page.evaluate(key => parseFloat(getComputedStyle(document.querySelector('[data-lexical-editor]').__lexicalEditor.getElementByKey(key).querySelector('p') ?? document.querySelector('[data-lexical-editor]').__lexicalEditor.getElementByKey(key)).lineHeight) || 26, k.target);
  const gap = t.bottom - w.bottom;
  check(`${label}: dropped, it is lined up with that paragraph, its bottom inside the last line`,
    /align=bottom/.test(layout ?? '') && gap >= -1 && gap < lineHeight, { layout, widget: w, target: t, lineHeight });
  check(`${label}: no page errors`, errors.length === 0, errors);
  await page.context().close();
};

try {
  await run('five milestones (525px tall)', `${ROUTE}/editor`, 'Five milestones', 'The model marks progress with five milestones', 'The later milestones are defined');
  await run('blocks demo, first widget', `${ROUTE}/blocks/editor`, 'Text flows beside a widget', "A paragraph's lines get shorter", 'AI content flows');
} finally {
  await browser.close();
}
console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
process.exit(failures ? 1 : 0);
