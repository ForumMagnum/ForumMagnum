// EXPERIMENT (experiment/iframe-layout-ronny-exp3).
// "Start below widget" (WidgetClearNode, Oct 30 2026) and section headings that start below widgets. In the blocks
// demo's "Starting below a widget" section, at 1280px:
// - with the caret in a paragraph beside the widget, a "↓ Below widget" chip shows in the margin (not for the
//   paragraph the widget lines up with); clicking it starts the paragraph below the widget, with a marker;
// - Backspace at the paragraph's start, or the marker's ✕, puts it back beside the widget;
// - the Post tab keeps it (and a phone shows no gap for it);
// - every H2 starts below the widgets before it, in the editor and the post.
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
  await page.waitForTimeout(7000);
  const frames = (n = 4) => page.evaluate((n) => new Promise(r => { let i = 0; const f = () => (++i >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);

  // The paragraph starting with `start`, its widget (the float before it), and whether a marker precedes it.
  const state = (start, view = 'editor') => page.evaluate(([start, view]) => {
    const root = view === 'editor' ? document.querySelector('[data-lexical-editor]') : document.querySelector('[data-testid=widget-drag-post-body]');
    const p = [...root.querySelectorAll('p')].find(el => el.textContent.trim().startsWith(start));
    if (!p) return null;
    let el = p.previousElementSibling;
    while (el && el.matches('.sentinel-paragraph')) el = el.previousElementSibling;
    const marked = !!el?.matches('.lw-widget-clear');
    let w = p.previousElementSibling;
    while (w && !w.matches('.iframe-widget-code[data-lw-wraps], .iframe-widget:has(> .lwFloatedWidget)')) w = w.previousElementSibling;
    const widget = (w?.matches('.iframe-widget') ? w.querySelector('iframe') : w)?.getBoundingClientRect();
    const prev = (() => { let e = p.previousElementSibling; while (e && !e.matches('p')) e = e.previousElementSibling; return e?.getBoundingClientRect(); })();
    return { top: p.getBoundingClientRect().top, widgetBottom: widget?.bottom ?? null, marked, gapAbove: prev ? p.getBoundingClientRect().top - prev.bottom : null };
  }, [start, view]);
  const caretIn = (start, atStart = true) => page.evaluate(([start, atStart]) => {
    const root = document.querySelector('[data-lexical-editor]');
    const editor = root.__lexicalEditor;
    const p = [...root.querySelectorAll('p')].find(el => el.textContent.trim().startsWith(start));
    p.scrollIntoView({ block: 'center' });
    root.focus();
    const key = p[`__lexicalKey_${editor._key}`];
    editor.update(() => { const n = editor.getEditorState()._nodeMap.get(key).getLatest(); atStart ? n.selectStart() : n.selectEnd(); });
  }, [start, atStart]);
  const chip = () => page.evaluate(() => {
    const b = document.querySelector('[data-testid=widget-start-below]');
    return b && b.getBoundingClientRect().width > 0;
  });

  const FIRST = 'Text beside a widget keeps flowing';
  const TARGET = 'This paragraph starts beside the widget';
  await caretIn(FIRST);
  await frames(6);
  check('no chip for the paragraph the widget lines up with', !(await chip()));
  await caretIn(TARGET);
  await frames(6);
  const before = await state(TARGET);
  check('the target paragraph starts beside the widget', before && before.widgetBottom && before.top < before.widgetBottom, before);
  check('the chip shows for a paragraph beside the widget', await chip());
  await page.click('[data-testid=widget-start-below]');
  await frames(8);
  const below = await state(TARGET);
  check('clicked: it starts below the widget, after a marker', below?.marked && below.top >= below.widgetBottom, below);
  check('the marker says so', await page.evaluate(() => /Starts below the widget/.test(document.querySelector('[data-testid=widget-clear-marker]')?.textContent ?? '')));
  await caretIn(TARGET);
  await page.keyboard.press('Backspace');
  await frames(8);
  const back = await state(TARGET);
  check('Backspace at its start: back beside the widget, marker gone', back && !back.marked && back.top < back.widgetBottom, back);
  await caretIn(TARGET);
  await frames(6);
  await page.click('[data-testid=widget-start-below]');
  await frames(6);
  await page.click('[data-testid=widget-clear-marker] button');
  await frames(8);
  const crossed = await state(TARGET);
  check('the marker\'s ✕ removes it too', crossed && !crossed.marked && crossed.top < crossed.widgetBottom, crossed);
  // The blank-lines hint, in "Text flows beside a widget" (a right widget, its first paragraph lined up with it):
  // Enter at the end of that paragraph. One blank line beside the widget: no hint (unless it pushed the next block
  // below the widget). Two: the hint. Its button: the blank lines go and the next block starts below the widget.
  {
    const P1 = "A paragraph's lines get shorter";
    const hints = () => page.evaluate(() => [...document.querySelectorAll('[data-testid=widget-blank-lines-hint]')]
      .map(h => h.textContent.replace(/\s+/g, ' ').trim()));
    const nextBelow = () => page.evaluate(() => {
      const root = document.querySelector('[data-lexical-editor]');
      const ai = root.querySelector(':scope > .llm-content-block');
      let w = ai.previousElementSibling;
      while (w && !w.matches('.iframe-widget-code[data-lw-wraps]')) w = w.previousElementSibling;
      const r = w.getBoundingClientRect();
      let prev = ai.previousElementSibling;
      while (prev?.matches('.sentinel-paragraph')) prev = prev.previousElementSibling;
      return { below: ai.getBoundingClientRect().top >= r.bottom + 15, marked: !!prev?.matches('.lw-widget-clear') };
    });
    await caretIn(P1, false);
    await page.keyboard.press('Enter');
    await frames(8);
    const one = { hints: await hints(), ...(await nextBelow()) };
    check('one blank line beside the widget: a hint only if it pushed the next block below the widget', one.hints.length === (one.below ? 1 : 0), one);
    await page.keyboard.press('Enter');
    await frames(8);
    const two = await hints();
    check('two blank lines beside the widget: "Use ↓ Below widget to move text below a widget"',
      two.length === 1 && /^Use ↓ Below widget to move text below a widget$/.test(two[0]), two);
    for (let i = 0; i < 8 && !(await nextBelow()).below; i++) {
      await page.keyboard.press('Enter');
      await frames(6);
    }
    check('blank lines that pushed the next block below the widget: the hint stays', (await nextBelow()).below && (await hints()).length === 1, await hints());
    await page.click('[data-testid=widget-blank-lines-hint] button');
    await frames(8);
    const fixed = { hints: await hints(), ...(await nextBelow()) };
    const blanksLeft = await page.evaluate((start) => {
      const root = document.querySelector('[data-lexical-editor]');
      const p = [...root.querySelectorAll(':scope > p')].find(el => el.textContent.trim().startsWith(start));
      let el = p.nextElementSibling, n = 0;
      while (el && !el.matches('.llm-content-block')) { if (el.matches('p:not(.sentinel-paragraph)') && !el.textContent.trim()) n++; el = el.nextElementSibling; }
      return n;
    }, P1);
    check('its button: blank lines gone, the next block starts below the widget after a marker, no hint',
      fixed.hints.length === 0 && fixed.below && fixed.marked && blanksLeft === 0, { ...fixed, blanksLeft });
    // (Clean up: the marker's ✕.)
    await page.evaluate(() => {
      const root = document.querySelector('[data-lexical-editor]');
      const ai = root.querySelector(':scope > .llm-content-block');
      let prev = ai.previousElementSibling;
      while (prev?.matches('.sentinel-paragraph')) prev = prev.previousElementSibling;
      prev?.querySelector('button')?.click();
    });
    await frames(6);
  }

  // Keep one for the Post tab.
  await caretIn(TARGET);
  await frames(6);
  await page.click('[data-testid=widget-start-below]');
  await frames(6);

  // One per widget (Ronny, Oct 30 2026): in the Lists section, add one to a later block beside the left widget
  // first, then to an earlier one: only the earlier one stays. A pasted second one goes too.
  {
    const keysWithChip = [];
    const candidates = await page.evaluate(() => {
      const root = document.querySelector('[data-lexical-editor]');
      const editor = root.__lexicalEditor;
      const heading = [...root.querySelectorAll(':scope > h2')].find(h => h.textContent.trim() === 'Lists');
      const keys = [];
      for (let el = heading.nextElementSibling; el && !el.matches('h2'); el = el.nextElementSibling) {
        if (el.matches('.sentinel-paragraph, .iframe-widget-code, .lw-widget-clear')) continue;
        keys.push(el[`__lexicalKey_${editor._key}`]);
      }
      return keys;
    });
    for (const key of candidates) {
      await page.evaluate((key) => {
        const root = document.querySelector('[data-lexical-editor]');
        const editor = root.__lexicalEditor;
        editor.getElementByKey(key).scrollIntoView({ block: 'center' });
        root.focus();
        editor.update(() => editor.getEditorState()._nodeMap.get(key).getLatest().selectStart());
      }, key);
      await frames(6);
      if (await chip()) keysWithChip.push(key);
    }
    const markersInLists = () => page.evaluate(() => {
      const root = document.querySelector('[data-lexical-editor]');
      const heading = [...root.querySelectorAll(':scope > h2')].find(h => h.textContent.trim() === 'Lists');
      let n = 0;
      for (let el = heading.nextElementSibling; el && !el.matches('h2'); el = el.nextElementSibling) if (el.matches('.lw-widget-clear')) n++;
      return n;
    });
    const addFor = async (key) => {
      await page.evaluate((key) => {
        const root = document.querySelector('[data-lexical-editor]');
        const editor = root.__lexicalEditor;
        root.focus();
        editor.update(() => editor.getEditorState()._nodeMap.get(key).getLatest().selectStart());
      }, key);
      await frames(6);
      await page.click('[data-testid=widget-start-below]');
      await frames(6);
    };
    if (keysWithChip.length < 2) {
      check('the Lists section has two blocks beside its widget to try this on', false, keysWithChip);
    } else {
      await addFor(keysWithChip[1]);
      await addFor(keysWithChip[0]);
      const one = await markersInLists();
      const before = await page.evaluate((key) => {
        const root = document.querySelector('[data-lexical-editor]');
        let el = root.__lexicalEditor.getElementByKey(key).previousElementSibling;
        while (el?.matches('.sentinel-paragraph')) el = el.previousElementSibling;
        return !!el?.matches('.lw-widget-clear');
      }, keysWithChip[0]);
      check('adding one above an existing one leaves only one, the upper one', one === 1 && before, { one, before });
      // A second one put in by other means (a paste, say) goes.
      await page.evaluate((key) => {
        const root = document.querySelector('[data-lexical-editor]');
        const editor = root.__lexicalEditor;
        const Klass = editor._nodes.get('widget-clear').klass;
        editor.update(() => editor.getEditorState()._nodeMap.get(key).getLatest().insertBefore(new Klass()));
      }, keysWithChip[1]);
      await frames(6);
      check('a second one after it is dropped', (await markersInLists()) === 1, await markersInLists());
    }
  }

  const h2sBelow = (view) => page.evaluate((view) => {
    const root = view === 'editor' ? document.querySelector('[data-lexical-editor]') : document.querySelector('[data-testid=widget-drag-post-body] .iframe-widget')?.parentElement;
    const bad = [];
    let lowest = -Infinity;
    for (const el of root.children) {
      const float = el.matches('.iframe-widget-code[data-lw-wraps]') ? el : el.querySelector?.(':scope > iframe.lwFloatedWidget');
      if (float) { lowest = Math.max(lowest, float.getBoundingClientRect().bottom); continue; }
      if (el.matches('h1, h2') && el.getBoundingClientRect().top < lowest) bad.push(el.textContent.trim().slice(0, 30));
    }
    return bad;
  }, view);
  check('editor: every H2 starts below the widgets before it', (await h2sBelow('editor')).length === 0, await h2sBelow('editor'));

  await page.goto(`${BASE}${POST}`, { waitUntil: 'load', timeout: 240000 });
  await page.waitForSelector('[data-testid=widget-drag-post-body] iframe.lwFloatedWidget', { timeout: 240000 });
  await page.waitForTimeout(5000);
  const post = await state(TARGET, 'post');
  check('the Post tab keeps it: below the widget, after the marker', post?.marked && post.top >= post.widgetBottom, post);
  check('post: every H2 starts below the widgets before it', (await h2sBelow('post')).length === 0, await h2sBelow('post'));
  await page.setViewportSize({ width: 375, height: 800 });
  await page.waitForTimeout(2500);
  const phone = await state(TARGET, 'post');
  check('on a phone it leaves no gap (the widget is full width there)', phone && phone.gapAbove !== null && phone.gapAbove < 40, phone);
  check('no page errors', errors.length === 0, errors);
} finally {
  await browser.close();
}
console.log(failures ? `\n${failures} FAILED` : '\nall passed');
process.exit(failures ? 1 : 0);
