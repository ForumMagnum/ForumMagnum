// EXPERIMENT (experiment/iframe-layout-ronny-exp3).
// No two widgets share a height (Ronny, Oct 29 2026: "if you passed a horizontal line down the post, it
// would only ever intersect one widget at a time"). Each widget the text wraps around lines up with the top
// or the bottom of one paragraph, no other widget lines up with that paragraph, and none is still beside it.
// Checks, in the blocks demo's editor at 1280px, around "Text flows beside a widget" (a right widget at the
// top of its first paragraph, running on beside the AI content after it), with the next section's left
// widget:
// - Ronny's three placements: dragged to the first paragraph's top (1) or to the AI content (2), the left
//   widget moves down to the last paragraph, below the right widget's end, and the chip says so; dragged to
//   the last paragraph (3), it lands there, lined up with its top;
// - then no two widgets share a height, in the editor or on the Post tab;
// - the arrow keys move a widget only to paragraphs with room, never beside another widget;
// - the gear greys out Left and Right on a full-width widget whose text another widget is still beside, and
//   a resize that would make it wrap there leaves it full width.
// Needs the dev server (BASE_URL, default http://localhost:3001, the working copy; 3000 is Ronny's play
// copy, never tested against). Uses the installed Chrome, headless and muted; set PW_CHROMIUM to a Chrome
// binary where there is none.
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
    return r && { x: r.x, y: r.y, bottom: r.bottom, h: r.height };
  }, key);
  const scrollToKey = key => page.evaluate(key => document.querySelector('[data-lexical-editor]').__lexicalEditor.getElementByKey(key)?.scrollIntoView({ block: 'center' }), key);
  const rect = sel => page.evaluate((sel) => {
    const r = document.querySelector(sel)?.getBoundingClientRect();
    return r && { x: r.x, y: r.y, w: r.width, h: r.height, cx: r.x + r.width / 2, cy: r.y + r.height / 2, bottom: r.bottom };
  }, sel);
  const indicator = () => page.evaluate(() => ({ ...(document.querySelector('[data-testid=widget-drop-indicator]')?.dataset ?? {}) }));
  const column = () => page.evaluate(() => {
    const root = document.querySelector('[data-lexical-editor]');
    const cs = getComputedStyle(root);
    return { left: root.getBoundingClientRect().left + parseFloat(cs.paddingLeft), width: root.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) };
  });
  // Pairs of widgets sharing a height: the editor's top-level widgets, or the post's.
  const shared = (view = 'editor') => page.evaluate((view) => {
    const boxes = [...(view === 'editor'
      ? document.querySelector('[data-lexical-editor]').querySelectorAll(':scope > .iframe-widget-code')
      : document.querySelectorAll('[data-testid=widget-drag-post-body] iframe[data-lexical-iframe-widget]'))]
      .map(w => w.getBoundingClientRect()).filter(r => r.height > 0 && r.width > 0);
    const pairs = [];
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        if (boxes[i].top < boxes[j].bottom - 1 && boxes[j].top < boxes[i].bottom - 1) pairs.push(`${i}&${j}`);
      }
    }
    return { count: boxes.length, pairs };
  }, view);
  const grip = key => `[data-testid=widget-grip][data-widget-key="${key}"]`;
  const keyOf = async re => (await snapshot()).find(b => re.test(b.text))?.key;
  const widgets = async () => (await snapshot()).filter(b => b.type === 'iframe-widget');
  /** Press the widget's grip, drag to (x, block's top + 5), read the indicator; release or cancel. */
  const dragTo = async (key, targetKey, { release }) => {
    await page.evaluate(sel => document.querySelector(sel)?.scrollIntoView({ block: 'center' }), grip(key));
    await frames(2);
    const g = await rect(grip(key));
    await page.mouse.move(g.cx, g.cy);
    await page.mouse.down();
    await page.mouse.move(g.cx + 6, g.cy, { steps: 2 });
    await scrollToKey(targetKey);
    await frames(3);
    const t = await keyRect(targetKey);
    const col = await column();
    await page.mouse.move(col.left + 60, t.y + 5, { steps: 12 });
    await frames(4);
    const mid = { ind: await indicator(), ghost: await rect('[data-testid=widget-drop-ghost]') };
    if (!release) await page.keyboard.press('Escape');
    await page.mouse.up();
    await frames(4);
    return mid;
  };
  const nextContent = async key => {
    const blocks = await snapshot();
    return blocks[blocks.findIndex(b => b.key === key) + 1];
  };

  const first = await keyOf(/^A paragraph's lines get shorter/);
  const ai = await keyOf(/^(Claude Opus 5\.5)?\s*AI content flows/);
  const last = await keyOf(/^This last paragraph/);
  const [right, left] = await widgets();
  check('the demo has the section, its right widget and the next left widget', !!(first && ai && last && right && left)
    && /position=right/.test(right.text) && /position=left/.test(left.text), { first, ai, last, right, left });
  check('the demo starts with no two widgets at one height', (await shared()).pairs.length === 0, await shared());

  // 1 and 2: aimed beside the right widget, the left widget goes on below it.
  for (const [label, target] of [['1: the first paragraph\'s top, beside the right widget', first], ['2: the AI content, which the right widget is still beside', ai]]) {
    const mid = await dragTo(left.key, target, { release: false });
    const r = await keyRect(right.key);
    check(`state ${label}: moved down, clear of the right widget`, mid.ind.moved === 'down' && /moved down, clear of the widget above/.test(mid.ind.chip ?? '')
      && mid.ind.wraps === 'true' && mid.ghost && mid.ghost.y >= r.bottom, { ind: mid.ind, ghost: mid.ghost?.y, rightBottom: r.bottom });
  }
  // 3: below the right widget's end: allowed, lined up with the paragraph's top.
  {
    const mid = await dragTo(left.key, last, { release: true });
    check('state 3: the last paragraph, below the right widget\'s end: allowed', mid.ind.moved === '' && mid.ind.noRoom !== 'true', mid.ind);
    const next = await nextContent(left.key);
    const w = await keyRect(left.key);
    const p = await keyRect(last);
    // (A float starts at the block before's bottom margin: after AI content, which has none, up to 18px
    // above the paragraph's top.)
    check('  it lands there, lined up with the paragraph\'s top', next?.key === last && w.y >= p.y - 18 && w.y <= p.y + 7,
      { next: next?.text, widgetTop: w.y, paragraphTop: p.y });
    check('  no two widgets at one height in the editor', (await shared()).pairs.length === 0, await shared());
  }

  // The arrow keys: three steps up from there, each to a paragraph with room.
  for (let i = 1; i <= 3; i++) {
    await page.evaluate(sel => document.querySelector(sel)?.focus(), grip(left.key));
    await page.keyboard.press('ArrowUp');
    await frames(6);
    const s = await shared();
    const next = await nextContent(left.key);
    check(`ArrowUp ${i}: no two widgets at one height (now before "${next?.text?.slice(0, 24)}")`, s.pairs.length === 0, s);
  }

  // The gear: the left widget full width, moved between the first paragraph and the AI content (where it
  // clears the right widget). Left or Right would line it up with the AI content, beside the right widget.
  {
    const openGear = async (key) => {
      await page.evaluate(sel => document.querySelector(sel)?.scrollIntoView({ block: 'center' }), `[data-testid=widget-overlay][data-widget-key="${key}"]`);
      await frames(2);
      const gear = await rect(`[data-testid=widget-options][data-widget-key="${key}"]`) ?? await rect(`[data-widget-key="${key}"] [data-testid=widget-options]`);
      await page.mouse.move(gear.cx, gear.cy);
      await page.mouse.click(gear.cx, gear.cy);
      await frames(3);
    };
    const option = name => page.evaluate(name => {
      const b = document.querySelector(`[data-testid=widget-options-menu] [data-option="${name}"]`);
      return b && { disabled: b.disabled, pressed: b.getAttribute('aria-pressed') };
    }, name);
    await openGear(left.key);
    await page.click('[data-testid=widget-options-menu] [data-option="full"]');
    await frames(4);
    await page.keyboard.press('Escape');
    await frames(2);
    await dragTo(left.key, ai, { release: true });
    const next = await nextContent(left.key);
    check('a full-width widget dropped before the AI content goes there', next?.key === ai, next);
    await openGear(left.key);
    const [l, r] = [await option('left'), await option('right')];
    const note = await page.evaluate(() => document.querySelector('[data-testid=widget-options-no-room]')?.textContent ?? null);
    check('  its gear greys out Left and Right, and says why', l?.disabled && r?.disabled && /beside another widget/.test(note ?? ''), { l, r, note });
    await page.keyboard.press('Escape');
    await frames(2);
    // Pulling its right edge in to a third: the chip says there's no room, and letting go leaves it full width.
    const ov = await rect(`[data-testid=widget-overlay][data-widget-key="${left.key}"]`);
    const edge = await rect(`[data-widget-key="${left.key}"][data-testid=widget-resize-right]`) ?? await rect(`[data-testid=widget-overlay][data-widget-key="${left.key}"] [data-edge="right"]`);
    if (!edge) {
      check('  it has a right edge to pull', false, { ov });
    } else {
      await page.mouse.move(edge.cx, edge.cy);
      await page.mouse.down();
      const col = await column();
      await page.mouse.move(col.left + col.width * 0.33, edge.cy, { steps: 10 });
      await frames(4);
      const chip = await page.evaluate(() => document.querySelector('[data-testid=widget-drop-indicator]')?.dataset ?? null);
      await page.mouse.up();
      await frames(6);
      const tag = (await snapshot()).find(b => b.key === left.key)?.text ?? '';
      check('  pulled in to a third: no room, and it stays full width', /no room/.test(chip?.chip ?? '') && chip?.noRoom === 'true' && !/position=(left|right)/.test(tag),
        { chip: chip?.chip, noRoom: chip?.noRoom, tag });
    }
    check('  no two widgets at one height in the editor', (await shared()).pairs.length === 0, await shared());
  }

  // The Post tab shows these edits: no two widgets at one height there either.
  await page.goto(`${BASE}${POST}`, { waitUntil: 'load', timeout: 240000 });
  await page.waitForSelector('[data-testid=widget-drag-post-body] iframe[data-lexical-iframe-widget]', { timeout: 240000 });
  await page.waitForTimeout(5000);
  const post = await shared('post');
  check('the Post tab: no two widgets at one height', post.count > 0 && post.pairs.length === 0, post);
  check('no page errors', errors.length === 0, errors);
} finally {
  await browser.close();
}
console.log(failures ? `\n${failures} FAILED` : '\nall passed');
process.exit(failures ? 1 : 0);
