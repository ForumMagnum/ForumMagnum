// EXPERIMENT (experiment/iframe-layout-ronny-exp3).
// A widget lined up with the bottom of a paragraph shorter than it (Ronny, Nov 2 2026: "I aligned this to the
// bottom of the second paragraph in this section, but it doesn't look to me like it worked"). In the blocks
// demo's "Text flows beside a widget" section, at 1280px:
// - dragged to the left and down until its bottom reaches the AI content's (3 lines, much shorter than it), the
//   chip says "bottom of the paragraph", and the drop keeps the widget before the first paragraph with
//   span=2: it starts beside that paragraph and ends at the AI content's bottom, in the editor and the post;
// - narrower, where the widget shows full width, it goes where its top is in the text: below the first
//   paragraph, which starts above its top, and above the AI content, which starts beside it (Ronny, Nov 3 2026),
//   with nothing overlapping (editor and post, narrowed and loaded narrow); back at 1280 it lines up again;
// - the demo's own widget lined up with one long paragraph's bottom goes below that paragraph, which starts
//   above its top.
// Needs the dev server (BASE_URL, default http://localhost:3001, the working copy; 3000 is Ronny's play copy,
// never tested against). Uses the installed Chrome, headless and muted.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const BASE = process.env.BASE_URL || 'http://localhost:3001';
const POST = '/experiment-widget-blocks-7qunirv1o86fgfg7k1e9bru6e/blocks';
const NARROW = 420;
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
  const settle = async () => { await frames(8); await page.waitForTimeout(400); await frames(4); };

  // Top-level blocks: key, type, first words (a widget's: its layout tag).
  const snapshot = () => page.evaluate(() => {
    const root = document.querySelector('[data-lexical-editor]');
    const ed = root.__lexicalEditor;
    const keyProp = `__lexicalKey_${ed._key}`;
    return [...root.children].map((el) => {
      const node = ed.getEditorState()._nodeMap.get(el[keyProp]);
      return {
        key: el[keyProp],
        type: node?.getType?.(),
        text: el.matches('.iframe-widget-code') ? (el.textContent.match(/lw-layout" content="([^"]*)"/)?.[1] ?? '') : el.textContent.trim().slice(0, 40),
      };
    }).filter(b => b.type !== 'sentinel-paragraph');
  });
  const keyRect = key => page.evaluate((key) => {
    const r = document.querySelector('[data-lexical-editor]').__lexicalEditor.getElementByKey(key)?.getBoundingClientRect();
    return r && { top: Math.round(r.top), bottom: Math.round(r.bottom) };
  }, key);
  const scrollToKey = key => page.evaluate(key => document.querySelector('[data-lexical-editor]').__lexicalEditor.getElementByKey(key)?.scrollIntoView({ block: 'center' }), key);
  const rect = sel => page.evaluate((sel) => {
    const r = document.querySelector(sel)?.getBoundingClientRect();
    return r && { top: Math.round(r.top), bottom: Math.round(r.bottom), cx: r.x + r.width / 2, cy: r.y + r.height / 2 };
  }, sel);
  const indicator = () => page.evaluate(() => ({ ...(document.querySelector('[data-testid=widget-drop-indicator]')?.dataset ?? {}) }));
  const column = () => page.evaluate(() => {
    const root = document.querySelector('[data-lexical-editor]');
    const cs = getComputedStyle(root);
    return { left: root.getBoundingClientRect().left + parseFloat(cs.paddingLeft) };
  });
  const grip = key => `[data-testid=widget-grip][data-widget-key="${key}"]`;

  const blocks = await snapshot();
  const keyOf = re => blocks.find(b => re.test(b.text))?.key;
  const first = keyOf(/^A paragraph's lines get shorter/);
  const ai = keyOf(/^(Claude Opus 5\.5)?\s*AI content flows/);
  const last = keyOf(/^This last paragraph/);
  const widget = blocks.find(b => b.type === 'iframe-widget');
  check('the demo has the section and its widget', !!(first && ai && last && widget) && /position=right/.test(widget.text), { first, ai, last, widget });

  // Drag it to the left, and down until the ghost ends at the AI content's bottom.
  await page.evaluate(sel => document.querySelector(sel)?.scrollIntoView({ block: 'center' }), grip(widget.key));
  await frames(2);
  const g = await rect(grip(widget.key));
  await page.mouse.move(g.cx, g.cy);
  await page.mouse.down();
  await page.mouse.move(g.cx + 6, g.cy, { steps: 2 });
  const col = await column();
  await page.mouse.move(col.left + 60, g.cy, { steps: 6 });
  await frames(3);
  let during = {};
  for (let y = g.cy; y < g.cy + 200; y += 4) {
    await page.mouse.move(col.left + 60, y, { steps: 1 });
    await frames(2);
    during = await indicator();
    const ghost = await rect('[data-testid=widget-drop-ghost]');
    if (/bottom of the paragraph/.test(during.chip ?? '') && ghost && Math.abs(ghost.bottom - (await keyRect(ai)).bottom) <= 3) break;
  }
  check('moved until its bottom reaches the AI content\'s, the chip says bottom of the paragraph', /Left · 33% · bottom of the paragraph/.test(during.chip ?? ''), during);
  await page.mouse.up();
  await settle();

  // Lined up where it is now: the widget's box (the editor's spacer, or the post's frame) against the blocks.
  const lineUp = (view) => page.evaluate(([view, firstText]) => {
    const body = view === 'editor' ? document.querySelector('[data-lexical-editor]') : document.querySelector('[data-testid=widget-drag-post-body] .iframe-widget')?.parentElement;
    if (!body) return { missing: 'body' };
    const box = el => { const r = el.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom) }; };
    const p1 = [...body.querySelectorAll(':scope > p')].find(p => p.textContent.trim().startsWith(firstText));
    const aiBlock = body.querySelector(':scope > .llm-content-block');
    const p3 = [...body.querySelectorAll(':scope > p')].find(p => p.textContent.trim().startsWith('This last paragraph'));
    let w = p1?.previousElementSibling;
    while (w && !w.matches('.iframe-widget-code, .iframe-widget')) w = w.previousElementSibling;
    const shown = view === 'editor' ? w : w?.querySelector('iframe');
    if (!w || !shown || !aiBlock || !p3) return { missing: { p1: !!p1, widget: !!w, ai: !!aiBlock, p3: !!p3 } };
    return {
      widget: box(shown), p1: box(p1), ai: box(aiBlock), p3: box(p3),
      floats: getComputedStyle(shown).float !== 'none',
      transforms: [p1, aiBlock, w].map(el => el.style.transform).filter(Boolean).length,
    };
  }, [view, "A paragraph's lines get shorter"]);

  const after = await snapshot();
  const at = after.findIndex(b => b.key === widget.key);
  check('the drop lines it up with the second block after it: align=bottom span=2, before the first paragraph',
    after[at].text === 'position=left width=33% align=bottom span=2' && after[at + 1]?.key === first, { layout: after[at].text, next: after[at + 1]?.text });
  {
    const s = await lineUp('editor');
    check('editor: the widget ends at the AI content\'s bottom, starting beside the first paragraph',
      !!s && s.floats && Math.abs(s.widget.bottom - s.ai.bottom) <= 3 && s.widget.top < s.ai.top && s.widget.top >= s.p1.top - 18, s);
  }

  // Narrower: full width, below the AI content.
  await page.setViewportSize({ width: NARROW, height: 900 });
  await settle();
  await scrollToKey(ai);
  await settle();
  const narrowOk = (s) => !!s && !s.floats && s.widget.top >= s.p1.bottom - 1 && s.widget.bottom <= s.ai.top + 1 && s.ai.bottom <= s.p3.top + 1 && s.transforms === 2;
  // The demo's own widget lined up with one long paragraph's bottom.
  const single = (view) => page.evaluate((view) => {
    const body = view === 'editor' ? document.querySelector('[data-lexical-editor]') : document.querySelector('[data-testid=widget-drag-post-body] .iframe-widget')?.parentElement;
    const p = body && [...body.querySelectorAll(':scope > p')].find(el => el.textContent.trim().startsWith('This paragraph ends level'));
    let w = p?.previousElementSibling;
    while (w && !w.matches('.iframe-widget-code, .iframe-widget')) w = w.previousElementSibling;
    const shown = view === 'editor' ? w : w?.querySelector('iframe');
    let next = p?.nextElementSibling;
    while (next && next.getBoundingClientRect().height < 1) next = next.nextElementSibling;
    const box = (el) => { const r = el.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom) }; };
    return p && shown && next ? { paragraph: box(p), widget: box(shown), next: box(next), floats: getComputedStyle(shown).float !== 'none' } : { missing: true };
  }, view);
  const singleOk = s => !!s && !s.missing && !s.floats && s.widget.top >= s.paragraph.bottom - 1 && s.widget.bottom <= s.next.top + 1;
  {
    const s = await lineUp('editor');
    check(`editor at ${NARROW}px: full width, the first paragraph above it, the AI content below it, nothing overlapping`, narrowOk(s), s);
    const overlay = await page.evaluate((key) => {
      const r = document.querySelector(`[data-testid=widget-overlay][data-widget-key="${key}"]`)?.getBoundingClientRect();
      return r && Math.round(r.top);
    }, widget.key);
    check('  its frame shows there too', overlay !== null && s && Math.abs(overlay - s.widget.top) <= 3, { overlay, spacer: s?.widget.top });
  }

  {
    const s = await single('editor');
    check(`editor at ${NARROW}px: lined up with one long paragraph, that paragraph goes above it`, singleOk(s), s);
  }

  // Back at 1280 it lines up again, and nothing is left moved.
  await page.setViewportSize({ width: 1280, height: 900 });
  await settle();
  await scrollToKey(ai);
  await settle();
  {
    const s = await lineUp('editor');
    check('editor back at 1280px: lined up again, nothing left moved', !!s && s.floats && Math.abs(s.widget.bottom - s.ai.bottom) <= 3 && s.transforms === 0, s);
  }

  // The Post tab shows the same.
  await page.goto(`${BASE}${POST}`, { waitUntil: 'load', timeout: 240000 });
  await page.waitForSelector('[data-testid=widget-drag-post-body] iframe.lwFloatedWidget', { timeout: 240000 });
  await page.waitForTimeout(3000);
  await page.evaluate(() => document.querySelector('[data-testid=widget-drag-post-body] .llm-content-block')?.scrollIntoView({ block: 'center' }));
  await settle();
  {
    const s = await lineUp('post');
    check('post: the widget ends at the AI content\'s bottom, starting beside the first paragraph',
      !!s && s.floats && Math.abs(s.widget.bottom - s.ai.bottom) <= 3 && s.widget.top < s.ai.top && s.widget.top >= s.p1.top - 18, s);
  }
  await page.setViewportSize({ width: NARROW, height: 900 });
  await settle();
  await page.evaluate(() => document.querySelector('[data-testid=widget-drag-post-body] .llm-content-block')?.scrollIntoView({ block: 'center' }));
  await settle();
  check(`post at ${NARROW}px: full width, the first paragraph above it, the AI content below it, nothing overlapping`, narrowOk(await lineUp('post')), await lineUp('post'));
  check(`post at ${NARROW}px: lined up with one long paragraph, that paragraph goes above it`, singleOk(await single('post')), await single('post'));
  // Loaded narrow, as on a phone.
  await page.reload({ waitUntil: 'load', timeout: 240000 });
  await page.waitForSelector('[data-testid=widget-drag-post-body] iframe[data-lexical-iframe-widget]', { timeout: 240000 });
  await page.waitForTimeout(3000);
  await settle();
  check(`post loaded at ${NARROW}px: the same order`, narrowOk(await lineUp('post')) && singleOk(await single('post')), { spanning: await lineUp('post'), single: await single('post') });

  check('no page errors', errors.length === 0, errors);
} finally {
  await browser.close();
}
console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
process.exit(failures ? 1 : 0);
