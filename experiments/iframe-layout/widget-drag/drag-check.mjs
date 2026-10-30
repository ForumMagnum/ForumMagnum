// EXPERIMENT (experiment/iframe-layout-ronny-exp2): end-to-end check of Experiment 2 (drag widgets to
// place them) against a running dev server, with real mouse and key events (Playwright, i.e. CDP
// Input.dispatchMouseEvent). Not part of the repo's Playwright suite, which needs its own database.
//
//   node experiments/iframe-layout/widget-drag/drag-check.mjs
//
// BASE_URL (default http://localhost:3001, the working copy; 3000 is Ronny's play copy, never tested against) picks the server; OUT (default a temp folder) gets a
// screenshot per window size; ONLY (say ONLY=shrink,main) runs just the check groups whose names start
// with those words. Uses the installed Chrome, headless and muted, and always closes it.
// Exits 1 if any check fails.
//
// Test hooks it relies on (see IframeWidgetPlugin and WidgetDragLayer):
//   [data-lw-widget-drag]                   the Experiment 2 page
//   [data-lw-drag]                          the editor's anchor: idle | moving | resizing
//   [data-testid=widget-overlay]            per widget: data-widget-key, data-widget-id, data-gesture
//                                           (none | pressed | moving | resizing)
//   [data-testid=widget-grip]               the tab on a widget's top edge (also takes the keys: arrows,
//                                           [ and ], and the editor's undo/redo shortcuts). Only on a
//                                           top-level widget (not inside columns, a table, a collapsible
//                                           or a footnote), in preview, with HTML
//   [data-testid=widget-options]            the gear button (beside the code toggle); it opens
//   [data-testid=widget-options-menu]       its options: buttons with data-option full | left | right |
//                                           top | bottom | 25% | 33% ... (the drag editor has no
//                                           placement bar: this menu replaces it)
//   [data-testid=widget-resize-left|right]  resize edges (top-level widgets only)
//   [data-testid=widget-drop-indicator]     while dragging: data-kind, data-slot-key, data-before-key,
//                                           data-side, data-width, data-align (top | bottom: the drop lines
//                                           up with a paragraph's bottom), data-noop, data-snapped,
//                                           data-beside-opposite, data-pushes-down (heading | widget),
//                                           data-offscreen (above | below: the line is a stand-in at
//                                           that edge), data-at-end, data-chip, ...
//   [data-testid=widget-drop-line|widget-drop-ghost|widget-resize-tick]  (the ghost: data-cut="true"
//                                           when it stops at the next section)
//   [data-testid=widget-drag-chip]          data-above="true" when the chip sits above its point (the
//                                           resize chip near the bottom of the window)
//   [data-testid=widget-drag-announce]      aria-live text after keyboard moves and drops
//   [data-lw-drag-shield]                   the pointer shield (only during a gesture)
//   [data-testid=widget-shrink-warning]     under a widget its width leaves too small (data-widget-key);
//                                           the resize indicator's data-chip-warning says the same mid-drag
//   MOVE_IFRAME_WIDGET_COMMAND              found by type in editor._commands (see reviewChecks)
import os from 'os';
import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const BASE = process.env.BASE_URL || 'http://localhost:3001';
// EDITOR_PATH (exp3): which drag editor to check. Experiment 2's by default; Experiment 3's AI Futures
// editor is /experiment-widget-blocks-7qunirv1o86fgfg7k1e9bru6e/editor. Its Post tab is the same path without /editor.
const EDITOR_PATH = process.env.EDITOR_PATH || '/experiment-widget-drag-rrjhoz6rhigvo14qsbixz68ut/editor';
const POST_PATH = EDITOR_PATH.replace(/\/editor$/, '');
const EDITOR = `${BASE}${EDITOR_PATH}`;
const MVP1_EDITOR = `${BASE}/experiment-iframe-layout-tuito7fob8u0rzrbib0v16i1/editor`;
const OUT = process.env.OUT || fs.mkdtempSync(path.join(os.tmpdir(), 'widget-drag-check-'));

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` :: ${detail}` : ''}`);
}

const pushCount = (updates) => updates.filter(tags => tags.includes('history-push')).length;
// The editor re-adds the empty sentinel paragraphs around a moved widget in its own update, merged
// into the same undo step.
const onlyMerges = (updates) => updates.every(tags => tags.includes('history-push') || tags.includes('history-merge'));
const content = (snap) => snap.filter(c => c.type !== 'sentinel-paragraph');

async function openEditor(browser, width, height = 900, contextOptions = null) {
  // contextOptions: a page of its own browser context (say, an emulated touch screen).
  const context = contextOptions ? await browser.newContext({ viewport: { width, height }, ...contextOptions }) : null;
  const page = context ? await context.newPage() : await browser.newPage({ viewport: { width, height } });
  const errors = [];
  // LessWrong's invisible reCAPTCHA frame (www.google.com) logs Google's own report-only CSP notice now
  // and then, on a page left open long enough: not ours, so not counted.
  const thirdParty = (text) => /^Framing 'https:\/\/www\.google\.com\/' violates the following report-only/.test(text);
  page.on('console', m => { if (m.type() === 'error' && !thirdParty(m.text())) errors.push(m.text().slice(0, 300)); });
  page.on('pageerror', e => errors.push(`pageerror: ${e.message.slice(0, 300)}`));
  await page.goto(EDITOR, { waitUntil: 'domcontentloaded', timeout: 240000 });
  await page.waitForSelector('[data-testid=widget-overlay]', { state: 'attached', timeout: 240000 });
  // The demo holds the page at the top for 6s after load (until the reader scrolls or clicks).
  await page.waitForTimeout(7000);
  await page.evaluate(() => {
    const root = document.querySelector('[data-lexical-editor]');
    const t = { ed: root.__lexicalEditor, root, updates: [], loads: 0 };
    window.__dragCheck = t;
    t.ed.registerUpdateListener(({ tags, dirtyElements, dirtyLeaves }) => {
      if (dirtyElements.size + dirtyLeaves.size > 0 || tags.size > 0) t.updates.push([...tags]);
    });
    document.querySelectorAll('[data-testid=widget-overlay] iframe').forEach(f => f.addEventListener('load', () => t.loads++));
  });

  const h = {
    page,
    errors,
    close: async () => { await page.close(); if (context) await context.close(); },
    frames: (n = 3) => page.evaluate((n) => new Promise(r => { let i = 0; const f = () => (++i >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n),
    snapshot: () => page.evaluate(() => {
      const { ed, root } = window.__dragCheck;
      const keyProp = `__lexicalKey_${ed._key}`;
      const keys = [...root.children].map(el => el[keyProp]);
      return ed.getEditorState().toJSON().root.children.map((c, i) => ({
        key: keys[i],
        type: c.type,
        tag: c.tag ?? null,
        widgetId: c.widgetId ?? null,
        // A widget's first line (its lw-layout tag, if any); a block's first words.
        text: c.type === 'iframe-widget'
          ? (c.children || []).map(x => (x.type === 'linebreak' ? '\n' : (x.text ?? ''))).join('').split('\n')[0]
          : (JSON.stringify(c).match(/"text":"([^"]{0,40})/)?.[1] ?? ''),
      }));
    }),
    resetUpdates: () => page.evaluate(() => { window.__dragCheck.updates = []; }),
    updates: () => page.evaluate(() => window.__dragCheck.updates),
    rect: (sel) => page.evaluate((sel) => {
      const r = document.querySelector(sel)?.getBoundingClientRect();
      return r && { x: r.x, y: r.y, w: r.width, h: r.height, cx: r.x + r.width / 2, cy: r.y + r.height / 2, bottom: r.bottom };
    }, sel),
    keyRect: (key) => page.evaluate((key) => {
      const r = window.__dragCheck.ed.getElementByKey(key)?.getBoundingClientRect();
      return r && { x: r.x, y: r.y, w: r.width, h: r.height, cx: r.x + r.width / 2, cy: r.y + r.height / 2, bottom: r.bottom };
    }, key),
    scrollToKey: (key, block = 'center') => page.evaluate(([key, block]) => window.__dragCheck.ed.getElementByKey(key)?.scrollIntoView({ block }), [key, block]),
    scrollTo: (sel, block = 'center') => page.evaluate(([sel, block]) => document.querySelector(sel)?.scrollIntoView({ block }), [sel, block]),
    indicator: () => page.evaluate(() => ({ ...(document.querySelector('[data-testid=widget-drop-indicator]')?.dataset ?? {}) })),
    column: () => page.evaluate(() => {
      const root = document.querySelector('[data-lexical-editor]');
      return { left: root.getBoundingClientRect().left, width: root.clientWidth };
    }),
    widgetText: async (key) => (await h.snapshot()).find(c => c.key === key)?.text,
    /** The current key of the first widget whose layout tag matches. */
    widget: async (re) => (await h.snapshot()).find(c => c.type === 'iframe-widget' && re.test(c.text))?.key,
    grip: (key) => `[data-testid=widget-grip][data-widget-key="${key}"]`,
    overlay: (key) => `[data-testid=widget-overlay][data-widget-key="${key}"]`,
    /**
     * Press on `sel`, move past the threshold, then to `to` (a point or a function of the start rect),
     * release. `hover`: a selector to rest the pointer on first (the placement bar only shows, and only
     * takes the pointer, while its widget is hovered).
     */
    async drag(sel, to, { steps = 15, before, onMid, hover } = {}) {
      await h.scrollTo(sel);
      await h.frames(2);
      if (hover) {
        const r = await h.rect(hover);
        await page.mouse.move(r.cx, r.y + Math.min(60, r.h / 2));
        await h.frames(3);
      }
      const start = await h.rect(sel);
      await page.mouse.move(start.cx, start.cy);
      await page.mouse.down();
      await page.mouse.move(start.cx + 6, start.cy, { steps: 2 });
      if (before) await before();
      const target = typeof to === 'function' ? await to(start) : to;
      await page.mouse.move(target.x, target.y, { steps });
      await h.frames(3);
      const mid = {
        state: await page.evaluate(() => document.querySelector('[data-lw-drag]')?.dataset.lwDrag),
        ind: await h.indicator(),
      };
      if (onMid) await onMid(mid);
      await page.mouse.up();
      await h.frames(3);
      return mid;
    },
    async invariants(label) {
      const inv = await page.evaluate(() => {
        const { ed, loads } = window.__dragCheck;
        const mismatches = [...document.querySelectorAll('[data-testid=widget-overlay]')].map((o) => {
          const spacer = ed.getElementByKey(o.dataset.widgetKey);
          if (!spacer) return `no spacer for ${o.dataset.widgetKey}`;
          const a = o.getBoundingClientRect(), b = spacer.getBoundingClientRect();
          return Math.abs(a.top - b.top) > 1.5 || Math.abs(a.left - b.left) > 1.5 ? `${o.dataset.widgetKey} overlay/spacer apart` : null;
        }).filter(Boolean);
        return {
          shield: !!document.querySelector('[data-lw-drag-shield]'),
          bodyClass: document.body.classList.contains('lw-widget-dragging'),
          state: document.querySelector('[data-lw-drag]')?.dataset.lwDrag,
          iframesBlocked: [...document.querySelectorAll('iframe')].some(f => getComputedStyle(f).pointerEvents === 'none'),
          indicator: !!document.querySelector('[data-testid=widget-drop-indicator]'),
          iframeReloads: loads,
          mismatches,
          // EXPERIMENT (experiment/iframe-layout-ronny-exp3): no two widgets share a height (Ronny, Oct 29 2026).
          sharedHeights: (() => {
            const boxes = [...document.querySelectorAll('[data-lexical-editor] > .iframe-widget-code')]
              .map(w => w.getBoundingClientRect()).filter(r => r.height > 0);
            return boxes.flatMap((a, i) => boxes.slice(i + 1).filter(b => a.top < b.bottom - 1 && b.top < a.bottom - 1)).length;
          })(),
        };
      });
      const ok = !inv.shield && !inv.bodyClass && inv.state === 'idle' && !inv.iframesBlocked && !inv.indicator
        && inv.iframeReloads === 0 && inv.mismatches.length === 0 && inv.sharedHeights === 0;
      check(`  invariants after ${label}`, ok, ok ? '' : JSON.stringify(inv));
    },
  };
  return h;
}

async function mainChecks(browser) {
  const h = await openEditor(browser, 1024);
  const { page } = h;
  const col = await h.column();
  console.log(`\n== 1024px window, ${col.width}px column`);
  check('drag controls on the Experiment 2 page', await page.evaluate(() => !!document.querySelector('[data-lw-widget-drag]')
    && document.querySelectorAll('[data-testid=widget-grip]').length === 7));

  // S7: a click on a grip changes nothing and focuses it.
  {
    const key = await h.widget(/position=inline/);
    await h.resetUpdates();
    await h.scrollTo(h.grip(key));
    await h.frames(2);
    const r = await h.rect(h.grip(key));
    await page.mouse.move(r.cx, r.cy);
    await page.mouse.down();
    await page.mouse.up();
    await h.frames(3);
    const focused = await page.evaluate(() => document.activeElement?.dataset?.testid);
    check('S7 click on a grip: no updates, grip focused', (await h.updates()).length === 0 && focused === 'widget-grip', String(focused));
    await h.invariants('S7');
  }

  // S1: move the first full-width widget to the top of the post; undo and redo.
  {
    const key = await h.widget(/position=inline/);
    const before = await h.snapshot();
    const firstKey = content(before)[0].key;
    await h.resetUpdates();
    let scrollBefore;
    const mid = await h.drag(h.grip(key), async () => {
      await h.scrollToKey(firstKey);
      await h.frames(2);
      const first = await h.keyRect(firstKey);
      return { x: col.left + 100, y: first.y + 5 };
    }, { onMid: async () => { scrollBefore = await page.evaluate(() => window.scrollY); } });
    const after = await h.snapshot();
    const updates = await h.updates();
    check('S1 exactly one update, a history push', updates.length === 1 && pushCount(updates) === 1, JSON.stringify(updates));
    check('S1 widget is now first', content(after)[0].key === key && mid.ind.chip === 'Full width', `${content(after)[0].type} chip=${mid.ind.chip}`);
    const landed = await h.keyRect(key);
    const scrollAfter = await page.evaluate(() => window.scrollY);
    check('S1 no jump: the widget is in view where it was dropped', landed.y >= -5 && landed.y < 900 && Math.abs(scrollAfter - scrollBefore) < 900,
      `scrollY ${scrollBefore} -> ${scrollAfter}, widget top ${Math.round(landed.y)}`);
    await h.invariants('S1');
    const lastParagraph = after.filter(c => c.type === 'paragraph').at(-1).key;
    await h.scrollToKey(lastParagraph);
    await h.frames(2);
    const p = await h.keyRect(lastParagraph);
    await page.mouse.click(p.x + 20, p.y + 8);
    await page.keyboard.press('Meta+z');
    await h.frames(4);
    check('S1 one undo restores the post', JSON.stringify(await h.snapshot()) === JSON.stringify(before));
    await page.keyboard.press('Meta+Shift+z');
    await h.frames(4);
    check('S1 redo moves it again', JSON.stringify(await h.snapshot()) === JSON.stringify(after));
    await h.invariants('S1 undo/redo');
  }

  // S2: move a float between paragraphs.
  {
    const key = await h.widget(/position=left/);
    const snap = content(await h.snapshot());
    const pairs = [];
    for (let i = 0; i + 1 < snap.length; i++) {
      if (snap[i].type === 'paragraph' && snap[i + 1].type === 'paragraph') pairs.push([snap[i].key, snap[i + 1].key]);
    }
    const picks = [pairs[1], pairs[Math.floor(pairs.length / 2)], pairs.at(-2)].filter(Boolean);
    for (const [upper, lower] of picks) {
      await h.resetUpdates();
      const mid = await h.drag(h.grip(key), async () => {
        await h.scrollToKey(lower);
        await h.frames(2);
        const a = await h.keyRect(upper), b = await h.keyRect(lower);
        return { x: col.left + 60, y: (a.bottom + b.y) / 2 };
      });
      const after = content(await h.snapshot());
      const at = after.findIndex(c => c.key === key);
      // (Experiment 3: where another widget is in the way, it moves down past it, and the chip says so.)
      const aimed = mid.ind.slotKey === lower || (mid.ind.moved === 'down' && /moved down/.test(mid.ind.chip ?? ''));
      const landed = mid.ind.noop === 'true' || after[at + 1]?.key === mid.ind.slotKey;
      check(`S2 float lands before paragraph ${lower}, or past a widget in the way`, aimed && landed,
        `slot=${mid.ind.slotKey} moved=${mid.ind.moved} next=${after[at + 1]?.key}`);
    }
    await h.invariants('S2');
  }

  // S3: aimed just before a section heading (H1, H2), a float goes below it, lined up with the section's first
  // paragraph (section headings start below a widget: Oct 30 2026), and the chip says "Below the heading"; a
  // full-width widget lands right before it. (Before a smaller heading, which sits beside a widget, a float
  // lands right before it, where the post has one between two paragraphs.)
  {
    const snap = content(await h.snapshot());
    const floatKey = await h.widget(/position=left/);
    const fullKey = await h.widget(/position=inline/);
    const between = (c, i) => c.type === 'heading' && snap[i - 1]?.type === 'paragraph' && snap[i + 1]?.type === 'paragraph'
      && snap[i + 1]?.key !== floatKey && snap[i - 1]?.key !== floatKey;
    const sections = snap.filter((c, i) => between(c, i) && ['h1', 'h2'].includes(c.tag));
    const smaller = snap.filter((c, i) => between(c, i) && !['h1', 'h2'].includes(c.tag));
    const aimAt = (heading) => async () => {
      await h.scrollToKey(heading.key);
      await h.frames(2);
      const r = await h.keyRect(heading.key);
      return { x: col.left + 60, y: r.y + 3 };
    };
    // Where the float would go if dropped there (Escape: nothing changes). Candidates last first, skipping any
    // with another widget in the way.
    const probe = async (heading) => {
      let ind = null;
      await h.drag(h.grip(floatKey), aimAt(heading), { onMid: async (m) => { ind = m.ind; await page.keyboard.press('Escape'); } });
      return ind;
    };
    let section = null;
    for (const candidate of [...sections].reverse()) {
      const ind = await probe(candidate);
      if (ind && !ind.moved && ind.snapped === 'true' && /^Below the heading/.test(ind.chip ?? '')) { section = candidate; break; }
    }
    check('S3 a float aimed before a section heading goes below it ("Below the heading")', !!section);
    if (section) {
      await h.resetUpdates();
      await h.drag(h.grip(floatKey), aimAt(section));
      const after = content(await h.snapshot());
      const at = after.findIndex(c => c.key === floatKey);
      check('S3 ...and lands just after the heading', after[at - 1]?.key === section.key, `prev=${after[at - 1]?.type}`);
    }
    let small = null;
    for (const candidate of [...smaller].reverse()) {
      const ind = await probe(candidate);
      if (ind && !ind.moved && ind.snapped === 'false') { small = candidate; break; }
    }
    if (small) {
      await h.drag(h.grip(floatKey), aimAt(small));
      const after = content(await h.snapshot());
      const at = after.findIndex(c => c.key === floatKey);
      check('S3 a float lands right before a smaller heading', after[at + 1]?.key === small.key, `next=${after[at + 1]?.type}`);
    } else {
      console.log('  (S3: this post has no smaller heading between two paragraphs with room beside it)');
    }
    const target = section ?? sections.at(-1);
    if (target) {
      await h.resetUpdates();
      const mid2 = await h.drag(h.grip(fullKey), aimAt(target));
      const after = content(await h.snapshot());
      const at = after.findIndex(c => c.key === fullKey);
      check('S3 full-width widget lands right before the heading', mid2.ind.snapped === 'false'
        && (after[at + 1]?.key === target.key || (after[at + 1]?.key === floatKey && after[at + 2]?.key === target.key)),
        `next=${after[at + 1]?.type}`);
    }
    await h.invariants('S3');
  }

  // S4: a right float aimed beside a left float: no two widgets at one height (Experiment 3, Ronny, Oct 29
  // 2026), so it moves down to the first spot clear of it, and the chip says so.
  {
    const leftKey = await h.widget(/position=left/);
    const rightKey = await h.widget(/position=right/);
    const home = content(await h.snapshot());
    const homeNext = home[home.findIndex(c => c.key === rightKey) + 1]?.key ?? null;
    await h.resetUpdates();
    const mid = await h.drag(h.grip(rightKey), async () => {
      await h.scrollToKey(leftKey);
      await h.frames(2);
      const r = await h.keyRect(leftKey);
      return { x: col.left + (0.85 * col.width), y: r.y + 5 };
    });
    const after = content(await h.snapshot());
    const at = after.findIndex(c => c.key === rightKey);
    const [l, r] = [await h.keyRect(leftKey), await h.keyRect(rightKey)];
    check('S4 aimed beside another widget: moved down, clear of it', mid.ind.moved === 'down' && /moved down, clear of the widget above/.test(mid.ind.chip ?? '')
      && after[at - 1]?.key !== leftKey && r.y >= l.bottom && pushCount(await h.updates()) === 1,
      `chip=${mid.ind.chip} prev=${after[at - 1]?.key} left ${Math.round(l.y)}-${Math.round(l.bottom)} right ${Math.round(r.y)}`);
    // (Back where it was: the first spot clear of the left widget can be the end of the post, which the later
    // checks need free.)
    await dispatchMove(page, { key: rightKey, beforeKey: homeNext });
    await h.frames(4);
    await h.invariants('S4');
  }

  // S6: a side switch in place.
  {
    const key = await h.widget(/position=right/);
    const width = (await h.widgetText(key)).match(/width=(\d+%)/)[1];
    const before = content(await h.snapshot()).map(c => c.key);
    await h.resetUpdates();
    const mid = await h.drag(h.grip(key), (r) => ({ x: col.left + (0.2 * col.width), y: r.cy }));
    const text = await h.widgetText(key);
    check('S6 side switch: left, same width, same place, one step', mid.ind.side === 'left' && mid.ind.noop === 'false'
      && text.includes(`position=left width=${width}`) && JSON.stringify(content(await h.snapshot()).map(c => c.key)) === JSON.stringify(before)
      && pushCount(await h.updates()) === 1, text);
    await h.invariants('S6');
  }

  // S8: Escape mid-move and mid-resize changes nothing.
  {
    const key = await h.widget(/position=left/);
    const before = await h.snapshot();
    await h.resetUpdates();
    await h.scrollTo(h.grip(key));
    await h.frames(2);
    const r = await h.rect(h.grip(key));
    await page.mouse.move(r.cx, r.cy);
    await page.mouse.down();
    await page.mouse.move(r.cx + 10, r.cy + 200, { steps: 10 });
    await h.frames(3);
    await page.keyboard.press('Escape');
    await page.mouse.up();
    await h.frames(3);
    check('S8 Escape mid-move: nothing changes', (await h.updates()).length === 0 && JSON.stringify(await h.snapshot()) === JSON.stringify(before));
    await h.invariants('S8 move');
    const handle = `[data-testid=widget-resize-right][data-widget-key="${key}"]`;
    await h.scrollTo(h.overlay(key));
    await h.frames(2);
    const w0 = (await h.keyRect(key)).w;
    const e = await h.rect(handle);
    await page.mouse.move(e.cx, e.cy);
    await page.mouse.down();
    await page.mouse.move(col.left + (0.25 * col.width), e.cy, { steps: 8 });
    await h.frames(3);
    const wMid = (await h.keyRect(key)).w;
    await page.keyboard.press('Escape');
    await page.mouse.up();
    await h.frames(3);
    const w1 = (await h.keyRect(key)).w;
    check('S8 Escape mid-resize: width restored, nothing changes', wMid !== w0 && Math.abs(w1 - w0) < 1 && (await h.updates()).length === 0,
      `${w0} -> ${wMid} -> ${w1}`);
    await h.invariants('S8 resize');
  }

  // S9: let go over another widget's iframe.
  {
    const key = await h.widget(/position=inline/);
    const other = await h.widget(/position=right|position=left/);
    await h.resetUpdates();
    await h.drag(h.grip(key), async () => {
      await h.scrollTo(h.overlay(other));
      await h.frames(2);
      const r = await h.rect(`${h.overlay(other)} iframe`);
      return { x: r.cx, y: r.cy };
    });
    check('S9 drop over an iframe commits', pushCount(await h.updates()) <= 1);
    await h.invariants('S9');
  }

  // S10: auto-scroll near the bottom edge.
  {
    await page.setViewportSize({ width: 1024, height: 700 });
    await h.frames(3);
    // (A full-width one: a widget the text wraps around skips the spots where another widget is in the way,
    // which can be a long stretch.)
    const key = await h.widget(/position=inline/);
    await page.evaluate(() => window.scrollTo(0, 0));
    await h.scrollTo(h.grip(key));
    await h.frames(2);
    const r = await h.rect(h.grip(key));
    await h.resetUpdates();
    await page.mouse.move(r.cx, r.cy);
    await page.mouse.down();
    await page.mouse.move(r.cx + 5, r.cy + 10, { steps: 2 });
    await page.mouse.move(r.cx + 5, 690, { steps: 5 });
    await h.frames(2);
    const y0 = await page.evaluate(() => window.scrollY);
    const slot0 = (await h.indicator()).slotKey;
    await page.waitForTimeout(1200);
    const y1 = await page.evaluate(() => window.scrollY);
    const slot1 = (await h.indicator()).slotKey;
    await page.mouse.up();
    await h.frames(3);
    check('S10 holding at the bottom edge scrolls and moves the slot', y1 - y0 > 300 && slot0 !== slot1, `scrollY ${y0} -> ${y1}`);
    check('S10 the drop commits', pushCount(await h.updates()) === 1);
    await h.invariants('S10');
    await page.setViewportSize({ width: 1024, height: 900 });
    await h.frames(3);
  }

  // S11: resize a float by its text-side edge through each snap.
  {
    const key = await h.widget(/position=left/);
    const handle = `[data-testid=widget-resize-right][data-widget-key="${key}"]`;
    const original = await h.widgetText(key);
    for (const f of [0.25, 0.33, 0.38, 0.5]) {
      await h.resetUpdates();
      let live;
      await h.scrollTo(h.overlay(key));
      await h.drag(handle, (r) => ({ x: col.left + (f * col.width), y: r.cy }), {
        onMid: async () => {
          live = await page.evaluate((k) => {
            const s = window.__dragCheck.ed.getElementByKey(k);
            return { w: s.getBoundingClientRect().width, wraps: s.hasAttribute('data-lw-wraps'), updates: window.__dragCheck.updates.length };
          }, key);
        },
      });
      const text = await h.widgetText(key);
      const pct = `${Math.round(f * 100)}%`;
      check(`S11 resize to ${pct}: live preview, then one step`, Math.abs(live.w - Math.round(f * col.width)) <= 1 && live.wraps
        && live.updates === 0 && text.includes(`width=${pct}`) && pushCount(await h.updates()) <= 1, `${JSON.stringify(live)} ${text}`);
    }
    await h.resetUpdates();
    const mid = await h.drag(handle, (r) => ({ x: col.left + (0.85 * col.width), y: r.cy }));
    const fullText = await h.widgetText(key);
    check('S11 past 75%: full width', mid.ind.chip === 'Full width' && (/position=inline/.test(fullText) || !/lw-layout/.test(fullText)), fullText);
    for (let i = 0; i < 5; i++) await page.keyboard.press('Meta+z');
    await h.frames(4);
    check('S11 undo walks back to the original', (await h.widgetText(key)) === original, await h.widgetText(key));
    await h.invariants('S11');
  }

  // S12: a full-width widget pulled in from either edge becomes a float; back to full width is no change.
  // (Experiment 3: at the end of the post, where nothing is in its way as a float; it goes back after.)
  {
    const key = await h.widget(/position=inline/);
    const home = content(await h.snapshot());
    const homeNext = home[home.findIndex(c => c.key === key) + 1]?.key ?? null;
    await dispatchMove(page, { key, beforeKey: null });
    await h.frames(4);
    await h.scrollTo(h.overlay(key));
    await h.resetUpdates();
    await h.drag(`[data-testid=widget-resize-right][data-widget-key="${key}"]`, (r) => ({ x: col.left + (0.33 * col.width), y: r.cy }));
    check('S12 right edge in: left 33%', /position=left width=33%/.test(await h.widgetText(key)) && pushCount(await h.updates()) === 1,
      `${await h.widgetText(key)} pushes=${pushCount(await h.updates())} next=${(c => c[c.findIndex(x => x.key === key) + 1]?.type)(content(await h.snapshot()))}`);
    await page.keyboard.press('Meta+z');
    await h.frames(4);
    await h.scrollTo(h.overlay(key));
    await h.drag(`[data-testid=widget-resize-left][data-widget-key="${key}"]`, (r) => ({ x: col.left + col.width - (0.33 * col.width), y: r.cy }));
    check('S12 left edge in: right 33%', /position=right width=33%/.test(await h.widgetText(key)));
    await page.keyboard.press('Meta+z');
    await h.frames(4);
    await h.scrollTo(h.overlay(key));
    await h.resetUpdates();
    await h.drag(`[data-testid=widget-resize-right][data-widget-key="${key}"]`, (r) => ({ x: col.left + col.width - 4, y: r.cy }));
    check('S12 released at full width: no updates', (await h.updates()).length === 0);
    await dispatchMove(page, { key, beforeKey: homeNext });
    await h.frames(4);
    await h.invariants('S12');
  }

  // S16: the window shrinks mid-drag.
  {
    const key = await h.widget(/position=right|position=left/);
    await h.resetUpdates();
    let wide;
    const mid = await h.drag(h.grip(key), { x: 200, y: 300 }, {
      before: async () => {
        await h.frames(3);
        wide = await h.indicator();
        await page.setViewportSize({ width: 480, height: 900 });
        await h.frames(4);
      },
    });
    check('S16 chip switches to the narrow wording', /no room to wrap/.test(mid.ind.chip ?? '') || mid.ind.noop === 'true', `${wide?.chip} -> ${mid.ind.chip}`);
    await h.invariants('S16');
    await page.setViewportSize({ width: 1024, height: 900 });
    await h.frames(4);
  }

  // S17: keys on a focused grip.
  {
    const key = await h.widget(/position=right/);
    await page.evaluate((sel) => document.querySelector(sel).focus(), h.grip(key));
    const before = content(await h.snapshot()).findIndex(c => c.key === key);
    await h.resetUpdates();
    await page.keyboard.press('ArrowDown');
    await h.frames(4);
    const after = content(await h.snapshot()).findIndex(c => c.key === key);
    const announced = await page.evaluate(() => document.querySelector('[data-testid=widget-drag-announce]')?.textContent);
    check('S17 ArrowDown: one slot down, one step, announced', after > before && pushCount(await h.updates()) === 1 && !!announced, `${before} -> ${after}: ${announced}`);
    const focused = await page.evaluate(() => document.activeElement?.dataset?.testid);
    check('S17 the grip keeps focus', focused === 'widget-grip', String(focused));
    await h.resetUpdates();
    await page.keyboard.press('ArrowLeft');
    await h.frames(3);
    check('S17 ArrowLeft: left side', /position=left/.test(await h.widgetText(key)) && pushCount(await h.updates()) === 1);
    const widthBefore = (await h.widgetText(key)).match(/width=(\d+)%/)[1];
    await page.keyboard.press(']');
    await h.frames(3);
    const widthAfter = (await h.widgetText(key)).match(/width=(\d+)%/)?.[1];
    check('S17 ] steps the width up', Number(widthAfter) > Number(widthBefore) || widthBefore === '50', `${widthBefore} -> ${widthAfter}`);
    await h.invariants('S17');
  }

  // S19: the gear opens the widget's options; each choice is one undo step; Escape closes them.
  {
    const key = await h.widget(/position=left/);
    const gear = `[data-testid=widget-options][data-widget-key="${key}"]`;
    await h.scrollTo(h.overlay(key));
    await h.frames(2);
    await h.resetUpdates();
    await page.click(gear);
    await h.frames(2);
    const opened = !!(await page.$('[data-testid=widget-options-menu]'));
    await page.click('[data-testid=widget-options-menu] [data-option=right]');
    await h.frames(3);
    await page.click('[data-testid=widget-options-menu] [data-option=bottom]');
    await h.frames(3);
    const text = await h.widgetText(key);
    const pushes = pushCount(await h.updates());
    await page.keyboard.press('Escape');
    await h.frames(2);
    const closed = !(await page.$('[data-testid=widget-options-menu]'));
    await page.keyboard.press(UNDO);
    await page.keyboard.press(UNDO);
    await h.frames(4);
    check('S19 the gear sets the side and the alignment, one undo step each', opened && closed && /position=right/.test(text)
      && /align=bottom/.test(text) && pushes === 2 && !/position=right|align=bottom/.test(await h.widgetText(key)),
      `${text} pushes=${pushes} opened=${opened} closed=${closed}`);
    await h.invariants('S19');
  }

  // S5: drop at the end of the post (before the footnotes), below the last block and any widget still
  // beside it (Experiment 3: headings no longer clear widgets, so the last section's text can run beside
  // widgets placed before its heading).
  {
    const key = await h.widget(/position=left|position=right/);
    const snap = content(await h.snapshot());
    const last = snap.filter(c => c.type !== 'footnote-section').at(-1).key;
    await h.resetUpdates();
    const endOfPost = () => page.evaluate(([last, dragged]) => {
      const { ed } = window.__dragCheck;
      const floats = [...document.querySelectorAll('[data-lexical-editor] > .iframe-widget-code[data-lw-wraps]')]
        .filter(f => f !== ed.getElementByKey(dragged)).map(f => f.getBoundingClientRect().bottom + 16);
      return Math.max(ed.getElementByKey(last).getBoundingClientRect().bottom, ...floats);
    }, [last, key]);
    const mid = await h.drag(h.grip(key), async () => {
      await h.scrollToKey(last);
      await h.frames(2);
      let end = await endOfPost();
      if (end + 40 > 860) {
        await page.mouse.wheel(0, end + 40 - 700);
        await h.frames(4);
        end = await endOfPost();
      }
      return { x: col.left + 100, y: Math.min(end + 40, 860) };
    });
    const after = content(await h.snapshot());
    const at = after.findIndex(c => c.key === key);
    check('S5 end of post, before the footnotes', /^End of post/.test(mid.ind.chip ?? '') && after[at + 1]?.type === 'footnote-section'
      && after.at(-1).type === 'footnote-section', `chip=${mid.ind.chip}`);
    await h.invariants('S5');
  }

  const tabs = await page.evaluate(() => [...document.querySelectorAll('a')].filter(a => ['Post', 'Editor'].includes(a.textContent)).map(a => `${a.textContent}=${a.getAttribute('href')}`));
  check('tabs: Post opens this experiment\'s post, Editor this page', tabs.includes(`Post=${POST_PATH}`)
    && tabs.includes(`Editor=${EDITOR_PATH}`), tabs.join(' '));
  check('no console errors at 1024', h.errors.length === 0, h.errors.join(' || '));
  await page.screenshot({ path: path.join(OUT, 'drag-check-1024.png') });
  await page.close();
}

// L1-L7 (added after an adversarial review): where a drop really lands, what the chip says about it
// and where it stays, keys pressed during a drag, the focus after one, and keyboard moves in view.
async function landingChecks(browser) {
  const h = await openEditor(browser, 1024);
  const { page } = h;
  const col = await h.column();
  console.log(`\n== landing checks, 1024px window, ${col.width}px column`);
  const lineTop = () => page.evaluate(() => document.querySelector('[data-testid=widget-drop-line]')?.getBoundingClientRect().top);

  // L1: a full-width widget aimed at a gap with a float still running beside it clears that float: the
  // line is drawn below the float (not across it), the chip says so, and the widget lands at the line.
  {
    const key = await h.widget(/position=inline/);
    const snap = content(await h.snapshot());
    const at = snap.findIndex(c => /^Try the calculator/.test(c.text));
    const lower = snap[at].key;
    const upper = snap.slice(0, at).reverse().find(c => c.type === 'paragraph').key;
    let line;
    const mid = await h.drag(h.grip(key), async () => {
      await h.scrollToKey(lower);
      await h.frames(2);
      const a = await h.keyRect(upper);
      const b = await h.keyRect(lower);
      return { x: col.left + 100, y: (a.bottom + b.y) / 2 };
    }, { onMid: async () => { line = await lineTop(); } });
    await h.frames(3);
    const landed = await h.keyRect(key);
    check('L1 full width beside a float: drawn below it, lands at the line', /below the widget beside it/.test(mid.ind.chip ?? '')
      && Math.abs(landed.y - line) < 30, `chip=${mid.ind.chip} line ${Math.round(line)} landed ${Math.round(landed.y)}`);
    await h.invariants('L1');
  }

  // L2: a float aimed just before a full-width widget goes below it (which would clear it and leave it
  // beside nothing), like below a heading.
  {
    const key = await h.widget(/position=right width=42%/);
    const full = (await h.snapshot()).filter(c => c.type === 'iframe-widget' && /position=inline/.test(c.text)).at(-1).key;
    const mid = await h.drag(h.grip(key), async () => {
      await h.scrollTo(h.overlay(full));
      await h.frames(2);
      const r = await h.keyRect(full);
      return { x: col.left + (0.8 * col.width), y: r.y + 4 };
    });
    const after = content(await h.snapshot());
    const at = after.findIndex(c => c.key === key);
    check('L2 a float aimed before a full-width widget goes below it', /^Below the widget · Right/.test(mid.ind.chip ?? '')
      && after[at - 1]?.key === full, `chip=${mid.ind.chip} prev=${after[at - 1]?.key}`);
    await h.invariants('L2');
  }

  // L3: a float dropped at the end of the post: the footnotes start below it, not beside it.
  {
    const key = await h.widget(/position=left/);
    const last = content(await h.snapshot()).filter(c => c.type !== 'footnote-section').at(-1).key;
    const mid = await h.drag(h.grip(key), async () => {
      await h.scrollToKey(last);
      await h.frames(2);
      const r = await h.keyRect(last);
      return { x: col.left + 100, y: Math.min(r.bottom + 40, 760) };
    });
    const footnotes = await h.rect('.footnote-section');
    const widget = await h.keyRect(key);
    check('L3 a float at the end of the post: the footnotes start below it', /^End of post/.test(mid.ind.chip ?? '')
      && footnotes.y >= widget.bottom - 1, `chip=${mid.ind.chip} widget bottom ${Math.round(widget.bottom)}, footnotes top ${Math.round(footnotes.y)}`);
    await h.invariants('L3');
  }

  // L4: with the caret in the text, keys pressed while a widget is held (typing, undo) change nothing.
  {
    const key = content(await h.snapshot()).find(c => c.type === 'iframe-widget').key;
    const p = content(await h.snapshot()).find(c => c.type === 'paragraph').key;
    await h.scrollToKey(p);
    await h.frames(2);
    const pr = await h.keyRect(p);
    await page.mouse.click(pr.x + 5, pr.y + 8);
    await h.frames(2);
    const before = await h.snapshot();
    await h.resetUpdates();
    await h.scrollTo(h.grip(key));
    await h.frames(2);
    const g = await h.rect(h.grip(key));
    await page.mouse.move(g.cx, g.cy);
    await page.mouse.down();
    await page.mouse.move(g.cx + 6, g.cy, { steps: 2 });
    await page.mouse.move(g.cx, g.cy + 200, { steps: 8 });
    await page.keyboard.type('KK');
    await page.keyboard.press(UNDO);
    await h.frames(3);
    const mid = await dragState(page);
    const midUpdates = (await h.updates()).length;
    await page.keyboard.press('Escape');
    await page.mouse.up();
    await h.frames(3);
    check('L4 keys pressed during a drag change nothing', mid === 'moving' && midUpdates === 0
      && JSON.stringify(await h.snapshot()) === JSON.stringify(before), `${mid}, ${midUpdates} updates mid-drag`);
    await h.invariants('L4');
  }

  // L5: after a click inside a widget, dragging it leaves the focus on its grip (not on <body>), so
  // the editor's undo shortcut undoes the drop.
  {
    const key = await h.widget(/position=right width=46%/);
    await h.scrollTo(h.overlay(key));
    await h.frames(2);
    const f = await h.rect(`${h.overlay(key)} iframe`);
    await page.mouse.click(f.cx, f.y + f.h - 20);
    await page.waitForTimeout(300);
    const active = await page.evaluate(() => document.activeElement?.tagName);
    const order = async () => content(await h.snapshot()).map(c => c.key).join(',');
    const before = await order();
    const target = content(await h.snapshot()).filter(c => c.type === 'paragraph').at(-3).key;
    await h.drag(h.grip(key), async () => {
      await h.scrollToKey(target);
      await h.frames(2);
      const r = await h.keyRect(target);
      return { x: col.left + (0.8 * col.width), y: r.y + 3 };
    });
    const moved = await order();
    const focused = await page.evaluate(() => document.activeElement?.dataset?.testid ?? document.activeElement?.tagName);
    await page.keyboard.press(UNDO);
    await h.frames(4);
    check('L5 after using a widget, the undo shortcut undoes dragging it', active === 'IFRAME' && moved !== before
      && focused === 'widget-grip' && (await order()) === before, `${active} -> ${focused}`);
    await h.invariants('L5');
  }

  // L6: keyboard moves keep the widget itself in view (not just its grip at the bottom edge).
  {
    const key = await h.widget(/position=inline/);
    await h.scrollTo(h.grip(key));
    await h.frames(2);
    const g = await h.rect(h.grip(key));
    await page.mouse.click(g.cx, g.cy);
    await h.frames(2);
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('ArrowDown');
      await h.frames(6);
    }
    const r = await h.keyRect(key);
    const bar = await h.rect('[data-lw-bottom-bar]');
    check('L6 keyboard moves keep the widget in view, above the bottom bar', r.y >= 0 && r.bottom <= bar.y,
      `widget ${Math.round(r.y)}-${Math.round(r.bottom)}, bar at ${Math.round(bar.y)}`);
    await h.invariants('L6');
  }

  // L7: held over the demo's bottom bar, the chip stays readable above it.
  {
    const key = await h.widget(/position=left/);
    await h.scrollTo(h.grip(key));
    await h.frames(2);
    const g = await h.rect(h.grip(key));
    await page.mouse.move(g.cx, g.cy);
    await page.mouse.down();
    await page.mouse.move(g.cx + 6, g.cy, { steps: 2 });
    await page.mouse.move(col.left + 60, 880, { steps: 8 });
    await h.frames(4);
    const chip = await h.rect('[data-testid=widget-drag-chip]');
    const bar = await h.rect('[data-lw-bottom-bar]');
    await page.keyboard.press('Escape');
    await page.mouse.up();
    await h.frames(3);
    check('L7 the chip stays above the bottom bar', !!chip && chip.y >= 0 && chip.bottom <= bar.y, `chip ${chip && Math.round(chip.bottom)}, bar ${Math.round(bar.y)}`);
    await h.invariants('L7');
  }

  check('no console errors in the landing checks', h.errors.length === 0, h.errors.join(' || '));
  await h.close();
}

// S13: at a 560px window the 50% width can't wrap: hollow tick, honest preview, stored anyway.
async function narrowChecks(browser) {
  const h = await openEditor(browser, 560);
  const { page } = h;
  const col = await h.column();
  console.log(`\n== 560px window, ${col.width}px column`);
  const key = await h.widget(/position=left/);
  await h.scrollTo(h.overlay(key));
  const edge = (await h.rect(`[data-testid=widget-resize-right][data-widget-key="${key}"]`)) ? 'right' : 'left';
  let live;
  const mid = await h.drag(`[data-testid=widget-resize-${edge}][data-widget-key="${key}"]`,
    (r) => ({ x: edge === 'right' ? col.left + (0.5 * col.width) : col.left + col.width - (0.5 * col.width), y: r.cy }), {
      onMid: async () => {
        live = await page.evaluate((k) => ({
          wraps: window.__dragCheck.ed.getElementByKey(k).hasAttribute('data-lw-wraps'),
          tick: document.querySelector('[data-testid=widget-resize-tick][data-label="50%"]')?.dataset.filled,
        }), key);
      },
    });
  check('S13 50%: hollow tick, explained, full width here, stored', /full width at this window size/.test(mid.ind.chip ?? '')
    && live.tick === 'false' && !live.wraps && /width=50%/.test(await h.widgetText(key)), `${mid.ind.chip} ${JSON.stringify(live)}`);
  await h.invariants('S13');
  // S13b: 25% of this column is under 150px: no 25% tick, no 25% button, and a pull to there snaps to 33%.
  const narrowest = await h.drag(`[data-testid=widget-resize-${edge}][data-widget-key="${key}"]`,
    (r) => ({ x: edge === 'right' ? col.left + (0.2 * col.width) : col.left + col.width - (0.2 * col.width), y: r.cy }), {
      onMid: async () => {
        live = await page.evaluate(() => [...document.querySelectorAll('[data-testid=widget-resize-tick]')].map(t => t.dataset.label));
      },
    });
  await h.scrollTo(h.overlay(key));
  await h.frames(2);
  await page.click(`[data-testid=widget-options][data-widget-key="${key}"]`);
  await h.frames(2);
  const buttons = await page.evaluate(() => [...document.querySelectorAll('[data-testid=widget-options-menu] [data-option]')]
    .map(b => b.textContent.trim()).filter(Boolean));
  await page.keyboard.press('Escape');
  await h.frames(2);
  check('S13b no width under 150px: no 25% tick or button, snaps to 33%', col.width * 0.25 < 150 && !live.includes('25%')
    && live.includes('33%') && !buttons.includes('25%') && buttons.includes('33%') && narrowest.ind.width === '33%',
    `${col.width}px: ticks ${live.join(' ')} buttons ${buttons.join(' ')} snap ${narrowest.ind.width}`);
  await h.invariants('S13b');
  check('no console errors at 560', h.errors.length === 0, h.errors.join(' || '));
  await page.screenshot({ path: path.join(OUT, 'drag-check-560.png') });
  await page.close();
}

// S14: phones: no resize edges; moves keep the stored layout byte for byte.
async function phoneChecks(browser) {
  const h = await openEditor(browser, 360, 800);
  const { page } = h;
  console.log('\n== 360px window');
  check('S14 no resize edges', (await page.$$('[data-testid^=widget-resize-]')).length === 0);
  const key = await h.widget(/position=left|position=right/);
  const before = await h.widgetText(key);
  const order = content(await h.snapshot()).findIndex(c => c.key === key);
  await h.resetUpdates();
  const mid = await h.drag(h.grip(key), (r) => ({ x: 10, y: r.cy - 250 }));
  const after = content(await h.snapshot()).findIndex(c => c.key === key);
  check('S14 move: "no room to wrap", layout unchanged', (/Full width here: no room to wrap/.test(mid.ind.chip ?? '') || mid.ind.noop === 'true')
    && (await h.widgetText(key)) === before, `${mid.ind.chip} ${order} -> ${after}`);
  await h.invariants('S14');
  check('no console errors at 360', h.errors.length === 0, h.errors.join(' || '));
  await page.screenshot({ path: path.join(OUT, 'drag-check-360.png') });
  await page.close();
}

// S15: on a very wide window, dragging into the page margin picks that side.
async function wideChecks(browser) {
  const h = await openEditor(browser, 2400);
  const { page } = h;
  console.log('\n== 2400px window');
  const key = await h.widget(/position=right/);
  await h.resetUpdates();
  const mid = await h.drag(h.grip(key), (r) => ({ x: 80, y: r.cy }));
  check('S15 the left margin picks left', mid.ind.side === 'left' && /position=left/.test(await h.widgetText(key)), mid.ind.chip);
  await h.invariants('S15');
  check('no console errors at 2400', h.errors.length === 0, h.errors.join(' || '));
  await page.close();
}

// S20: the first demo editor has no drag controls and its Editor tab still points at itself.
async function mvp1Checks(browser) {
  const page = await browser.newPage({ viewport: { width: 1024, height: 900 } });
  await page.goto(MVP1_EDITOR, { waitUntil: 'domcontentloaded', timeout: 240000 });
  await page.waitForSelector('[data-lexical-editor]', { timeout: 240000 });
  await page.waitForTimeout(3000);
  const found = await page.evaluate(() => ({
    controls: document.querySelectorAll('[data-testid^=widget-]').length,
    dragAttributes: document.querySelectorAll('[data-lw-widget-drag], [data-lw-drag]').length,
    editorTab: [...document.querySelectorAll('a')].find(a => a.textContent === 'Editor')?.getAttribute('href'),
  }));
  check('S20 first editor: no drag controls', found.controls === 0 && found.dragAttributes === 0
    && found.editorTab === '/experiment-iframe-layout-tuito7fob8u0rzrbib0v16i1/editor', JSON.stringify(found));
  // On this branch the demo post's Editor tab opens Experiment 3 (the branch deploys to its own project).
  await page.goto(`${BASE}/experiment-iframe-layout-tuito7fob8u0rzrbib0v16i1?textWidth=normal`, { waitUntil: 'domcontentloaded', timeout: 240000 });
  await page.waitForFunction(() => [...document.querySelectorAll('a')].some(a => a.textContent === 'Editor'), null, { timeout: 240000 });
  const postTab = await page.evaluate(() => [...document.querySelectorAll('a')].find(a => a.textContent === 'Editor')?.getAttribute('href'));
  check('S20 the demo post\'s Editor tab opens Experiment 3', postTab === '/experiment-widget-blocks-7qunirv1o86fgfg7k1e9bru6e/editor', String(postTab));
  await page.close();
}

// The editor's own undo/redo shortcuts, which the grips pass on (Lexical's isUndo/isRedo).
const UNDO = process.platform === 'darwin' ? 'Meta+z' : 'Control+z';
const REDO = process.platform === 'darwin' ? 'Meta+Shift+z' : 'Control+y';
const dragState = (page) => page.evaluate(() => document.querySelector('[data-lw-drag]')?.dataset.lwDrag);
/** Dispatches MOVE_IFRAME_WIDGET_COMMAND (found by its type) and returns whether the editor took it. */
const dispatchMove = (page, payload) => page.evaluate((payload) => {
  const { ed } = window.__dragCheck;
  const move = [...ed._commands.keys()].find(c => c.type === 'MOVE_IFRAME_WIDGET_COMMAND');
  return ed.dispatchCommand(move, payload);
}, payload);

// R1-R8: fixes from the review of Experiment 2 (Oct 27 2026), on a fresh page at 1024.
async function reviewChecks(browser) {
  const h = await openEditor(browser, 1024);
  const { page } = h;
  console.log('\n== review fixes, 1024px window');
  const order = async () => JSON.stringify(content(await h.snapshot()).map(c => c.key));

  // R1: undo and redo on a focused grip (the grips are outside the editable text, so the editor never
  // sees their keys). The caret isn't moved: the grip keeps the focus and the page stays put.
  {
    const key = await h.widget(/position=right/);
    // The caret goes far away first, so putting it back would scroll the page there.
    const last = content(await h.snapshot()).filter(c => c.type === 'paragraph').at(-1).key;
    await h.scrollToKey(last);
    await h.frames(2);
    const p = await h.keyRect(last);
    await page.mouse.click(p.x + 20, p.y + 8);
    await h.scrollTo(h.grip(key));
    await h.frames(2);
    const g = await h.rect(h.grip(key));
    await page.mouse.click(g.cx, g.cy);
    const before = await order();
    await page.keyboard.press('ArrowDown');
    await h.frames(6);
    const moved = await order();
    const y0 = await page.evaluate(() => window.scrollY);
    await page.keyboard.press(UNDO);
    await h.frames(6);
    const undone = await order();
    const y1 = await page.evaluate(() => window.scrollY);
    const focused = await page.evaluate(() => document.activeElement?.dataset?.testid);
    await page.keyboard.press(REDO);
    await h.frames(6);
    check('R1 undo on a focused grip undoes a keyboard move', moved !== before && undone === before);
    check('R1 ...the grip keeps the focus and the page stays put', focused === 'widget-grip' && Math.abs(y1 - y0) < 2, `${focused} scrollY ${y0} -> ${y1}`);
    check('R1 redo on the grip moves it again', (await order()) === moved);
    await page.keyboard.press(UNDO);
    await h.frames(4);
    await h.invariants('R1');
  }

  // R2: Escape cancels a drag while a widget's iframe has the keyboard (after a click inside it).
  {
    const key = content(await h.snapshot()).find(c => c.type === 'iframe-widget').key;
    await h.scrollTo(h.overlay(key));
    await h.frames(2);
    const f = await h.rect(`${h.overlay(key)} iframe`);
    await page.mouse.click(f.cx, f.y + f.h - 20);
    await page.waitForTimeout(300);
    const active = await page.evaluate(() => document.activeElement?.tagName);
    const before = await h.snapshot();
    await h.resetUpdates();
    const g = await h.rect(h.grip(key));
    await page.mouse.move(g.cx, g.cy);
    await page.mouse.down();
    await page.mouse.move(g.cx + 6, g.cy, { steps: 2 });
    await page.mouse.move(g.cx, g.cy + 400, { steps: 12 });
    await h.frames(3);
    const mid = await dragState(page);
    await page.keyboard.press('Escape');
    await h.frames(2);
    const afterEscape = await dragState(page);
    await page.mouse.up();
    await h.frames(3);
    check("R2 Escape cancels a drag while a widget's iframe has the keyboard", active === 'IFRAME' && mid === 'moving' && afterEscape === 'idle'
      && (await h.updates()).length === 0 && JSON.stringify(await h.snapshot()) === JSON.stringify(before), `${active}: ${mid} -> ${afterEscape}`);
    await h.invariants('R2');
  }

  // R3: a press whose release never arrives. A context menu (macOS opens one on Control-click, and it
  // takes the release) ends it; failing that, the next press drops the drag instead of committing it.
  {
    const key = content(await h.snapshot()).filter(c => c.type === 'iframe-widget')[1].key;
    await h.scrollTo(h.grip(key));
    await h.frames(2);
    const before = await h.snapshot();
    await h.resetUpdates();
    let g = await h.rect(h.grip(key));
    await page.mouse.move(g.cx, g.cy);
    await page.mouse.down();
    await page.evaluate(() => document.querySelector('[data-lw-drag-shield]')?.dispatchEvent(
      new MouseEvent('contextmenu', { bubbles: true, cancelable: true, ctrlKey: true })));
    await h.frames(2);
    const shield = await page.evaluate(() => !!document.querySelector('[data-lw-drag-shield]'));
    await page.mouse.move(g.cx, g.cy + 300, { steps: 8 });
    await h.frames(3);
    const hovering = await dragState(page);
    await page.mouse.up();
    await h.frames(3);
    check('R3 a context menu ends a mouse press on a grip', !shield && hovering === 'idle' && (await h.updates()).length === 0,
      `shield=${shield} state=${hovering}`);
    await h.scrollTo(h.grip(key));
    await h.frames(2);
    g = await h.rect(h.grip(key));
    await page.mouse.move(g.cx, g.cy);
    await page.mouse.down();
    await page.mouse.move(g.cx, g.cy + 300, { steps: 10 });
    await h.frames(3);
    const moving = await dragState(page);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: g.cx, y: g.cy + 300, button: 'left', buttons: 1, clickCount: 1 });
    await h.frames(2);
    const afterPress = await dragState(page);
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: g.cx, y: g.cy + 300, button: 'left', buttons: 0, clickCount: 1 });
    await cdp.detach();
    await page.mouse.up();
    await h.frames(3);
    check('R3 a second press of the same pointer cancels a stuck drag', moving === 'moving' && afterPress === 'idle'
      && (await h.updates()).length === 0 && JSON.stringify(await h.snapshot()) === JSON.stringify(before), `${moving} -> ${afterPress}`);
    await h.invariants('R3');
  }

  // R5: a vertical slip on a resize edge doesn't start a resize (which would snap an off-grid width).
  {
    const w = content(await h.snapshot()).find(c => c.type === 'iframe-widget' && /width=4[246]%/.test(c.text));
    const edge = (await page.$(`[data-testid=widget-resize-left][data-widget-key="${w.key}"]`)) ? 'left' : 'right';
    const sel = `[data-testid=widget-resize-${edge}][data-widget-key="${w.key}"]`;
    await h.scrollTo(sel);
    await h.frames(2);
    const e = await h.rect(sel);
    await h.resetUpdates();
    await page.mouse.move(e.cx, e.cy);
    await page.mouse.down();
    await page.mouse.move(e.cx + 1, e.cy + 12, { steps: 4 });
    await h.frames(3);
    const slipped = await dragState(page);
    await page.mouse.up();
    await h.frames(3);
    check('R5 a vertical slip on a resize edge leaves an off-grid width alone', slipped === 'idle' && (await h.updates()).length === 0
      && (await h.widgetText(w.key)) === w.text, `${slipped} ${w.text}`);
    await h.invariants('R5');
  }

  // R6: near the bottom of the window the resize chip goes above the pointer (clear of the demo's
  // bottom bar and the window's edge).
  {
    const key = await h.widget(/position=left/);
    const sel = `[data-testid=widget-resize-right][data-widget-key="${key}"]`;
    const y = 900 - 80;
    await page.evaluate(([sel, y]) => { const r = document.querySelector(sel).getBoundingClientRect(); window.scrollBy(0, r.top + (r.height / 2) - y); }, [sel, y]);
    await h.frames(3);
    const e = await h.rect(sel);
    await page.mouse.move(e.cx, y);
    await page.mouse.down();
    await page.mouse.move(e.cx - 60, y, { steps: 6 });
    await h.frames(3);
    const chip = await page.evaluate(() => {
      const c = document.querySelector('[data-testid=widget-drag-chip]');
      return c && { above: c.dataset.above, bottom: Math.round(c.getBoundingClientRect().bottom) };
    });
    await page.keyboard.press('Escape');
    await page.mouse.up();
    await h.frames(3);
    check('R6 near the bottom of the window the resize chip sits above the pointer', chip?.above === 'true' && chip.bottom <= y - 15
      && chip.bottom <= 900 - 64, JSON.stringify(chip));
    await h.invariants('R6');
  }

  // R8: the site header, which slides back in as a drag auto-scrolls up, stays tucked away until the
  // drag ends.
  {
    const key = content(await h.snapshot()).filter(c => c.type === 'iframe-widget').at(-1).key;
    await h.scrollTo(h.grip(key));
    await page.mouse.move(500, 450);
    await page.mouse.wheel(0, -150);
    await page.waitForTimeout(400);
    const header = () => page.evaluate(() => {
      const el = document.querySelector('.headroom');
      return el && { pinned: el.classList.contains('headroom--pinned'), bottom: Math.round(el.getBoundingClientRect().bottom) };
    });
    const g = await h.rect(h.grip(key));
    await page.mouse.move(g.cx, g.cy);
    await page.mouse.down();
    await page.mouse.move(g.cx + 6, g.cy, { steps: 2 });
    await page.mouse.move(g.cx, 10, { steps: 10 });
    await page.waitForTimeout(600);
    const during = await header();
    await page.keyboard.press('Escape');
    await page.mouse.up();
    await page.waitForTimeout(400);
    const after = await header();
    check('R8 the site header stays out of the way while dragging, and comes back after', !during
      || (during.bottom <= 1 && (!after.pinned || after.bottom > 0)), `${JSON.stringify(during)} -> ${JSON.stringify(after)}`);
    await h.invariants('R8');
  }

  // R4: a widget put inside another block (here a column of a two-column layout) moves straight out, to
  // just before that block, and keeps its drag controls (Experiment 3, Oct 29 2026: widgets never go inside
  // other blocks).
  {
    const grips = (await page.$$('[data-testid=widget-grip]')).length;
    const key = content(await h.snapshot()).find(c => c.type === 'iframe-widget').key;
    // The same node (same key) moves into the first column of a new two-column layout.
    const containerKey = await page.evaluate((key) => new Promise((resolve) => {
      const { ed } = window.__dragCheck;
      let made = null;
      ed.update(() => {
        const widget = ed._pendingEditorState._nodeMap.get(key).getLatest();
        const make = (type, ...args) => new (ed._nodes.get(type).klass)(...args);
        const container = make('layout-container', '1fr 1fr');
        const first = make('layout-item');
        const second = make('layout-item');
        widget.insertBefore(container);
        container.append(first, second);
        second.append(make('paragraph'));
        first.append(widget);
        made = container.getKey();
      }, { onUpdate: () => resolve(made) });
    }), key);
    await h.frames(4);
    const placed = await page.evaluate(([key, containerKey]) => {
      const { ed } = window.__dragCheck;
      return ed.getEditorState().read(() => {
        const widget = ed.getEditorState()._nodeMap.get(key);
        let next = widget.getNextSibling();
        while (next?.getType() === 'sentinel-paragraph') next = next.getNextSibling();
        return { topLevel: widget.getParent()?.getType() === 'root', beforeColumns: next?.getKey() === containerKey };
      });
    }, [key, containerKey]);
    check('R4 a widget put inside columns moves out, to just before them', placed.topLevel && placed.beforeColumns, placed);
    check('R4 ...with its drag controls', (await page.$$(h.grip(key))).length === 1
      && (await page.$$('[data-testid=widget-grip]')).length === grips);
    await page.evaluate((containerKey) => new Promise((resolve) => {
      const { ed } = window.__dragCheck;
      ed.update(() => { ed._pendingEditorState._nodeMap.get(containerKey).getLatest().remove(); }, { onUpdate: resolve });
    }), containerKey);
    await h.frames(4);
  }

  // R7: on a short, narrow float the resize strip is clear of the placement bar and the code toggle
  // (which move in from an edge that has a strip), the pill in its middle included.
  {
    const right = await h.widget(/position=right/);
    const left = await h.widget(/position=left/);
    await dispatchMove(page, { key: right, layout: { position: 'right', width: '25%' } });
    await dispatchMove(page, { key: left, layout: { position: 'left', width: '25%' } });
    await h.frames(4);
    const covered = {};
    for (const key of [right, left]) {
      await h.scrollTo(h.overlay(key));
      await h.frames(3);
      Object.assign(covered, await page.evaluate((key) => {
        const out = {};
        for (const strip of document.querySelectorAll(`[data-testid^=widget-resize][data-widget-key="${key}"]`)) {
          const r = strip.getBoundingClientRect();
          const misses = [];
          for (let y = Math.max(r.top, 0) + 3; y < Math.min(r.bottom, innerHeight) - 2; y += 6) {
            if (document.elementFromPoint(r.left + (r.width / 2), y) !== strip) misses.push(Math.round(y - r.top));
          }
          out[`${key}:${strip.dataset.testid}`] = misses;
        }
        return out;
      }, key));
    }
    check('R7 the resize strips of 25% floats are clear of the bar and the toggle', Object.keys(covered).length === 2
      && Object.values(covered).every(m => m.length === 0), JSON.stringify(covered));
  }

  check('no console errors in the review checks', h.errors.length === 0, h.errors.join(' || '));
  await page.close();
}

// E1-E6: sections, slots out of view, and the focus after a gesture (a fresh 1024x900 window).
async function edgeChecks(browser) {
  const h = await openEditor(browser, 1024, 900);
  const { page } = h;
  const col = await h.column();
  console.log('\n== edge checks, 1024x900 window');
  const keyOf = async (re) => content(await h.snapshot()).find(c => re.test(c.text))?.key;
  const R = (sel) => page.evaluate((sel) => {
    const el = document.querySelector(sel);
    const r = el?.getBoundingClientRect();
    return r && { top: r.top, bottom: r.bottom, cut: el.dataset.cut };
  }, sel);
  const press = async (key) => {
    await h.scrollTo(h.grip(key));
    await h.frames(2);
    const g = await h.rect(h.grip(key));
    await page.mouse.move(g.cx, g.cy);
    await page.mouse.down();
    await page.mouse.move(g.cx + 6, g.cy + 4, { steps: 2 });
  };
  const cancel = async () => {
    await page.keyboard.press('Escape');
    await page.mouse.up();
    await h.frames(3);
  };
  const barTop = async () => (await h.rect('[data-lw-bottom-bar]')).y;

  // E1: a float dropped in a short section before a section heading (H2). Experiment 3, Oct 30 2026: section
  // headings start below a widget, so the ghost stops at the heading or pushes it down (smaller headings sit
  // beside). (The widget after the heading goes to the end of the post meanwhile: no two widgets share a
  // height, so the dragged one would move down past it.)
  {
    const key = await h.widget(/position=left width=38%/);
    const para = await keyOf(/^Watch the gap/);
    const heading = await keyOf(/^Takeoff/);
    const blocks = content(await h.snapshot());
    const atHeading = blocks.findIndex(c => c.key === heading);
    const other = blocks.slice(atHeading).find(c => c.type === 'iframe-widget' && /position=(left|right)/.test(c.text));
    const otherNext = blocks[blocks.findIndex(c => c.key === other?.key) + 1]?.key ?? null;
    if (other) await dispatchMove(page, { key: other.key, beforeKey: null });
    await h.frames(4);
    await press(key);
    await h.scrollToKey(para);
    await h.frames(2);
    const t = await h.keyRect(para);
    await page.mouse.move(col.left + col.width - 40, t.y + 3, { steps: 4 });
    await h.frames(4);
    const ind = await h.indicator();
    const ghost = await R('[data-testid=widget-drop-ghost]');
    const hr = await h.keyRect(heading);
    await cancel();
    check('E1 a float before a section heading stops there: the heading starts below it', ind.slotKey === para && !ind.moved
      && (ind.pushesDown === 'heading' || (ghost?.cut === 'true' && ghost.bottom <= hr.y + 1)),
      `chip=${ind.chip} slot=${ind.slotKey} ghost bottom ${Math.round(ghost?.bottom)} heading ${Math.round(hr.y)}`);
    if (other) await dispatchMove(page, { key: other.key, beforeKey: otherNext });
    await h.frames(4);
    await h.invariants('E1');
  }

  // E2: aimed just under a heading with a float at its top, the widget moves down past that float (no two
  // widgets share a height), out of view: a dashed stand-in line at the bottom edge, above the bar, and the
  // chip (on screen) says so.
  {
    const key = await h.widget(/position=left width=44%/);
    const heading = await keyOf(/^Five milestones/);
    await press(key);
    await page.evaluate((k) => window.scrollBy(0, window.__dragCheck.ed.getElementByKey(k).getBoundingClientRect().top - 500), heading);
    await h.frames(3);
    const hr = await h.keyRect(heading);
    await page.mouse.move(col.left + 40, hr.bottom + 4, { steps: 4 });
    await h.frames(4);
    const ind = await h.indicator();
    const line = await R('[data-testid=widget-drop-line]');
    const chip = await R('[data-testid=widget-drag-chip]');
    const bar = await barTop();
    await cancel();
    check('E2 a slot below the window: line at the bottom edge above the bar, chip says so', ind.offscreen === 'below'
      && /lands below/.test(ind.chip ?? '') && line.top > 700 && line.bottom <= bar && chip.top >= 0 && chip.bottom <= bar,
      `chip=${ind.chip} line ${Math.round(line.top)}-${Math.round(line.bottom)} bar ${Math.round(bar)}`);
    await h.invariants('E2');
  }

  // E3: held near the bottom (auto-scrolling) or the top of the window, the line stays in view on
  // every frame, clear of the bar.
  {
    const key = await h.widget(/position=left width=38%/);
    await press(key);
    const bar = await barTop();
    const sample = () => page.evaluate(() => new Promise((resolve) => {
      const tops = [];
      const f = () => {
        const r = document.querySelector('[data-testid=widget-drop-line]')?.getBoundingClientRect();
        tops.push(r ? [Math.round(r.top), Math.round(r.bottom)] : null);
        if (tops.length >= 20) resolve(tops); else requestAnimationFrame(f);
      };
      requestAnimationFrame(f);
    }));
    await page.evaluate(() => window.scrollTo(0, 1500));
    await h.frames(2);
    await page.mouse.move(col.left + 60, 880, { steps: 3 });
    const low = await sample();
    await page.mouse.move(col.left + 60, 860 - 70, { steps: 3 });
    await h.frames(3);
    const nearBar = await sample();
    await page.evaluate(() => window.scrollTo(0, 3000));
    await h.frames(2);
    await page.mouse.move(col.left + 60, 20, { steps: 3 });
    const high = await sample();
    await cancel();
    const bad = [...low, ...nearBar, ...high].filter(t => !t || t[0] < 0 || t[1] > bar);
    check('E3 the drop line stays in view while auto-scrolling, clear of the bar', bad.length === 0,
      `${bad.length} of 60 frames out: ${JSON.stringify(bad.slice(0, 3))}`);
    await h.invariants('E3');
  }

  // E4: after a drag that started with nothing focused (a click on the page margin), the undo shortcut
  // undoes it, the page doesn't move, and no focus ring or placement bar is left showing.
  const quiet = (key) => page.evaluate((key) => {
    const o = document.querySelector(`[data-testid=widget-overlay][data-widget-key="${key}"]`);
    const grip = o.querySelector('[data-testid=widget-grip]');
    return {
      active: document.activeElement?.dataset?.testid ?? document.activeElement?.tagName,
      ring: grip.matches(':focus-visible'),
      bar: document.querySelector('[data-testid=widget-options-menu]') ? 'open' : '0',
    };
  }, key);
  const order = async () => content(await h.snapshot()).map(c => c.key).join(',');
  for (const start of ['margin', 'iframe']) {
    const key = await h.widget(/position=right width=46%/);
    const target = content(await h.snapshot()).filter(c => c.type === 'paragraph').at(-3).key;
    if (start === 'margin') {
      await page.mouse.click(20, 450);
    } else {
      await h.scrollTo(h.overlay(key));
      await h.frames(2);
      const f = await h.rect(`${h.overlay(key)} iframe`);
      await page.mouse.click(f.cx, f.y + f.h - 20);
      await page.waitForTimeout(300);
    }
    const before = await order();
    await h.drag(h.grip(key), async () => {
      await h.scrollToKey(target);
      await h.frames(2);
      const r = await h.keyRect(target);
      return { x: col.left + (0.8 * col.width), y: r.y + 3 };
    });
    await page.mouse.move(5, 300);
    await h.frames(4);
    await page.waitForTimeout(250);
    const moved = await order();
    const look = await quiet(key);
    const y0 = await page.evaluate(() => scrollY);
    await page.keyboard.press(UNDO);
    await h.frames(4);
    const y1 = await page.evaluate(() => scrollY);
    check(`E4 after a drag from ${start === 'margin' ? 'the page margin' : "a widget's iframe"}: undo works, nothing left showing`,
      moved !== before && (await order()) === before && look.active === 'widget-grip' && !look.ring && look.bar === '0' && Math.abs(y1 - y0) < 2,
      `${JSON.stringify(look)} scrollY ${y0} -> ${y1}`);
    await h.invariants(`E4 ${start}`);
  }

  // E5: the same after a resize from the page margin.
  {
    const key = await h.widget(/position=left width=38%/);
    const text = await h.widgetText(key);
    await page.mouse.click(20, 450);
    const sel = `[data-testid=widget-resize-right][data-widget-key="${key}"]`;
    await h.scrollTo(h.overlay(key));
    await h.frames(2);
    const o = await h.rect(h.overlay(key));
    await page.mouse.move(o.cx, o.cy);
    await h.frames(3);
    const e = await h.rect(sel);
    await page.mouse.move(e.cx, e.cy);
    await page.mouse.down();
    await page.mouse.move(e.cx - 40, e.cy, { steps: 4 });
    await page.mouse.move(col.left + (0.25 * col.width), e.cy, { steps: 6 });
    await h.frames(3);
    // E6: the ruler is a thin line, with no panel strip hiding the line of text under it.
    const ruler = await page.evaluate(() => {
      const r = document.querySelector('[data-testid=widget-resize-ruler]');
      return { h: r.getBoundingClientRect().height, before: getComputedStyle(r, '::before').content, bg: getComputedStyle(r).backgroundColor };
    });
    await page.mouse.up();
    await h.frames(3);
    await page.mouse.move(5, 300);
    await h.frames(3);
    await page.waitForTimeout(250);
    const resized = await h.widgetText(key);
    const look = await quiet(key);
    await page.keyboard.press(UNDO);
    await h.frames(4);
    check('E5 after a resize from the page margin: undo works, nothing left showing', resized !== text && (await h.widgetText(key)) === text
      && look.active === 'widget-grip' && !look.ring && look.bar === '0', `${resized} ${JSON.stringify(look)}`);
    check('E6 the resize ruler is a thin line with no strip behind it', ruler.h <= 3 && ruler.before === 'none', JSON.stringify(ruler));
    await h.invariants('E5');
  }

  // E7: after a drop, a drag that changes nothing (a full-width widget pulled sideways, which says how
  // to wrap text instead) and one cancelled with Escape leave the focus on a grip, so the undo shortcut
  // still undoes the drop.
  {
    const key = await h.widget(/position=right width=46%/);
    const full = await h.widget(/position=inline/);
    const target = content(await h.snapshot()).filter(c => c.type === 'paragraph').at(-3).key;
    await page.mouse.click(20, 450);
    const before = await order();
    await h.drag(h.grip(key), async () => {
      await h.scrollToKey(target);
      await h.frames(2);
      const r = await h.keyRect(target);
      return { x: col.left + (0.8 * col.width), y: r.y + 3 };
    });
    const moved = await order();
    const sideways = await h.drag(h.grip(full), (r) => ({ x: col.left + (0.9 * col.width), y: r.cy + 10 }));
    const afterNoop = await quiet(full);
    await press(full);
    await page.mouse.move(col.left + 100, 500, { steps: 4 });
    await h.frames(2);
    await cancel();
    const afterEscape = await quiet(full);
    await page.keyboard.press(UNDO);
    await h.frames(4);
    check('E7 a no-op or cancelled drag after a drop keeps undo working', moved !== before && (await order()) === before
      && afterNoop.active === 'widget-grip' && afterEscape.active === 'widget-grip' && !afterNoop.ring && !afterEscape.ring,
      `${JSON.stringify(afterNoop)} ${JSON.stringify(afterEscape)}`);
    check('E8 a full-width widget pulled sideways: still a no-op, the chip says to drag an edge', sideways.ind.noop === 'true'
      && sideways.ind.chip === 'Full width · drag an edge to wrap text', `${sideways.ind.noop} ${sideways.ind.chip}`);
    await h.invariants('E7');
  }

  // E9: a drop that lands below the window (E2) is then scrolled into view, its top below the header.
  {
    const key = await h.widget(/position=left width=44%/);
    const heading = await keyOf(/^Five milestones/);
    const before = await order();
    await press(key);
    await page.evaluate((k) => window.scrollBy(0, window.__dragCheck.ed.getElementByKey(k).getBoundingClientRect().top - 500), heading);
    await h.frames(3);
    const hr = await h.keyRect(heading);
    await page.mouse.move(col.left + 40, hr.bottom + 4, { steps: 4 });
    await h.frames(4);
    const ind = await h.indicator();
    await page.mouse.up();
    await page.waitForTimeout(1200);
    const landed = await h.keyRect(key);
    const bar = await barTop();
    const moved = (await order()) !== before;
    await page.keyboard.press(UNDO);
    await h.frames(4);
    check('E9 a drop that lands below the window is scrolled into view', ind.offscreen === 'below' && moved
      && landed.y >= 40 && landed.y <= 140 && landed.y < bar, `chip=${ind.chip} top ${Math.round(landed.y)}`);
    await h.invariants('E9');
  }

  check('no console errors in the edge checks', h.errors.length === 0, h.errors.join(' || '));
  await page.close();
}

// W1-W5: the shrink warning. A widget too wide for its width is zoomed down to fit, and the editor
// tells its author when that (or a chart stretched to fit) leaves it too small. The Experiment 2 post has
// one widget made for a 620px box, at right 50%, to show it.
async function shrinkWarningChecks(browser) {
  const h = await openEditor(browser, 1024);
  const { page } = h;
  const col = await h.column();
  console.log(`\n== shrink warning, 1024px window, ${col.width}px column`);
  const tags = () => page.evaluate(() => Object.fromEntries([...document.querySelectorAll('[data-testid=widget-shrink-warning]')]
    .map(el => [el.dataset.widgetKey, el.textContent])));
  const waitForTag = async (key, re, ms = 6000) => {
    for (let t = 0; t < ms; t += 100) {
      const text = (await tags())[key];
      if (re ? re.test(text ?? '') : text === undefined) return text ?? null;
      await page.waitForTimeout(100);
    }
    return (await tags())[key] ?? null;
  };
  const fixed = await h.widget(/position=right width=50%/);
  const charts = content(await h.snapshot()).filter(c => c.type === 'iframe-widget' && /position=inline/.test(c.text));
  const chart = charts[1]?.key;   // the time-horizon chart (the engine diagram is the first full-width widget)

  // W1: on load, the fixed-width widget at 50% says it's shrunk, and none of the demo's own widgets warns
  // (the smallest, the engine diagram's labels, show at 7.2px: under 7px warns).
  const loaded = await waitForTag(fixed, /^⚠ Shrunk to \d+% · text [\d.]+px$/);
  await page.waitForTimeout(1500);
  const others = Object.entries(await tags()).filter(([key]) => key !== fixed);
  check('W1 the fixed-width widget warns on load, no other widget does', !!loaded && others.length === 0,
    `${loaded} / others ${JSON.stringify(others)}`);
  await h.scrollTo(h.overlay(fixed));
  await h.frames(3);
  await page.screenshot({ path: path.join(OUT, 'shrink-warning-1024.png') });

  // W2: pulling its edge in to 25% warns on the chip before letting go; Escape changes nothing.
  {
    const edge = `[data-testid=widget-resize-left][data-widget-key="${fixed}"]`;
    await h.scrollTo(edge);
    await h.frames(2);
    const e = await h.rect(edge);
    const before = await h.widgetText(fixed);
    await page.mouse.move(e.cx, e.cy);
    await page.mouse.down();
    await page.mouse.move(e.cx + 6, e.cy, { steps: 2 });
    await page.mouse.move(col.left + col.width * 0.75, e.cy, { steps: 12 });
    let ind = {};
    for (let i = 0; i < 40 && !ind.chipWarning; i++) { await h.frames(2); ind = await h.indicator(); }
    await page.screenshot({ path: path.join(OUT, 'shrink-warning-chip.png') });
    await page.keyboard.press('Escape');
    await page.mouse.up();
    await h.frames(4);
    check('W2 the resize chip warns at 25% before the drop', ind.snap === '0.25' && /^Shrunk to 2\d% · text [\d.]+px$/.test(ind.chipWarning ?? '')
      && (await h.widgetText(fixed)) === before, `snap=${ind.snap} chip=${ind.chip} warning=${ind.chipWarning}`);
    await h.invariants('W2');
  }

  // W3: at full width it fits, so the warning goes; undo brings both back.
  {
    await h.drag(`[data-testid=widget-resize-left][data-widget-key="${fixed}"]`, (s) => ({ x: col.left + 4, y: s.cy }));
    const gone = await waitForTag(fixed, null);
    const full = !/position=(left|right)/.test(await h.widgetText(fixed));
    await page.keyboard.press(UNDO);
    await h.frames(4);
    const back = await waitForTag(fixed, /^⚠ Shrunk to/);
    check('W3 full width clears the warning; undo brings it back', full && gone === null && !!back && /width=50%/.test(await h.widgetText(fixed)),
      `full=${full} gone=${gone} back=${back}`);
    await h.invariants('W3');
  }

  // W4: a chart is never zoomed, but its labels shrink with it: pulled in to 50%, it warns about them.
  {
    await h.drag(`[data-testid=widget-resize-right][data-widget-key="${chart}"]`, (s) => ({ x: col.left + col.width * 0.5, y: s.cy }));
    const text = await waitForTag(chart, /^⚠ Chart labels [\d.]+px$/);
    const layout = await h.widgetText(chart);
    await page.keyboard.press(UNDO);
    await h.frames(4);
    const cleared = await waitForTag(chart, null);
    check('W4 a chart pulled in to 50% warns about its labels; undo clears it', !!text && /position=left width=50%/.test(layout) && cleared === null,
      `${text} / ${layout} / after undo ${cleared}`);
    await h.invariants('W4');
  }

  // W5: the warning follows the window. Narrower, the 50% widget has no room to wrap and shows full
  // width, where (if the column is wide enough) it fits again.
  {
    await page.setViewportSize({ width: 640, height: 900 });
    await h.frames(6);
    const c = (await h.column()).width;
    const half = Math.round(c * 0.5);
    const shown = half >= 150 && c - half - 32 >= 300 ? half : c;
    const zoom = Math.min(1, shown / 620);
    // Its smallest text is 13px, a note under the chart.
    const warns = zoom < 0.85 || 13 * zoom < 7;
    const text = await waitForTag(fixed, warns ? /^⚠ Shrunk to/ : null);
    check('W5 a narrower window updates the warning', c < 682 && (warns ? !!text : text === null),
      `${c}px column, shown ${shown}px, zoom ${zoom.toFixed(2)}: ${text}`);
    await page.setViewportSize({ width: 1024, height: 900 });
    await h.frames(6);
    await h.invariants('W5');
  }

  check('no console errors in the shrink warning checks', h.errors.length === 0, h.errors.join(' || '));
  await h.close();
}

// B1-B3: a widget the text wraps around, dragged over the lower half of a paragraph, lines up with that
// paragraph's bottom (align=bottom); over the upper half, with its top.
async function bottomChecks(browser) {
  const h = await openEditor(browser, 1024);
  const { page } = h;
  const col = await h.column();
  console.log(`\n== bottom alignment, 1024px window, ${col.width}px column`);
  const key = await h.widget(/position=right width=42%/);
  const paragraph = content(await h.snapshot()).find((c, i, all) => all[i - 1]?.key === key || (c.type === 'paragraph' && all.findIndex(x => x.key === key) < i)).key;
  const lineUp = () => page.evaluate(([key, paragraph]) => {
    const { ed } = window.__dragCheck;
    const w = ed.getElementByKey(key).getBoundingClientRect(), p = ed.getElementByKey(paragraph).getBoundingClientRect();
    return { push: Number(ed.getElementByKey(key).dataset.lwBottomPush ?? 0), gap: Math.round(p.bottom - w.bottom), top: Math.round(w.top - p.top) };
  }, [key, paragraph]);

  // B1: into the lower half of its own paragraph: same place, now lined up with the paragraph's end.
  await h.resetUpdates();
  const mid = await h.drag(h.grip(key), async () => {
    const r = await h.keyRect(paragraph);
    return { x: col.left + col.width * 0.85, y: r.y + r.h * 0.8 };
  });
  await h.frames(6);
  const text = await h.widgetText(key);
  const lined = await lineUp();
  await page.screenshot({ path: path.join(OUT, 'bottom-aligned.png') });
  check('B1 dragged over a paragraph\'s lower half, it lines up with that paragraph\'s bottom', mid.ind.align === 'bottom'
    && /bottom of the paragraph/.test(mid.ind.chip ?? '') && /align=bottom/.test(text) && lined.push > 0 && lined.gap >= -1 && lined.gap < 40
    && pushCount(await h.updates()) === 1, `chip=${mid.ind.chip} ${text} ${JSON.stringify(lined)}`);
  await h.invariants('B1');

  // B2: the text keeps running beside it above (it isn't a box pushed down with empty space beside it).
  const besideAbove = await page.evaluate(([key, paragraph]) => {
    const { ed } = window.__dragCheck;
    const w = ed.getElementByKey(key).getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(ed.getElementByKey(paragraph));
    const lines = [...range.getClientRects()].filter(r => r.bottom < w.top - 4);
    return lines.length ? Math.round(Math.max(...lines.map(r => r.right))) : null;
  }, [key, paragraph]);
  check('B2 above it the paragraph runs the full column width', besideAbove !== null && besideAbove > col.left + col.width - 120,
    `lines above end at ${besideAbove}, column ends at ${Math.round(col.left + col.width)}`);

  // B3: back over the upper half: its top again. Then undo twice to the start.
  const mid3 = await h.drag(h.grip(key), async () => {
    const r = await h.keyRect(paragraph);
    return { x: col.left + col.width * 0.85, y: r.y + Math.min(30, r.h * 0.2) };
  });
  await h.frames(4);
  check('B3 over a paragraph\'s upper half, it lines up with its top', mid3.ind.align === 'top' && !/align=bottom/.test(await h.widgetText(key))
    && (await lineUp()).push === 0, `chip=${mid3.ind.chip} ${await h.widgetText(key)}`);
  await h.invariants('B3');
  check('no console errors in the bottom alignment checks', h.errors.length === 0, h.errors.join(' || '));
  await h.close();
}

// T1-T3: an emulated touch screen (hover: none, as on a tablet).
async function touchChecks(browser) {
  const h = await openEditor(browser, 768, 1024, { hasTouch: true, isMobile: true });
  const { page } = h;
  console.log('\n== touch screen, 768px window');
  if (!(await page.evaluate(() => matchMedia('(hover: none)').matches))) {
    console.log('SKIP touch checks: this emulation has no (hover: none)');
    await h.close();
    return;
  }
  const found = await page.evaluate(() => ({
    gears: [...document.querySelectorAll('[data-testid=widget-options]')].map(el => Number(getComputedStyle(el).opacity)),
    edges: [...document.querySelectorAll('[data-testid^=widget-resize]')].map(el => getComputedStyle(el).touchAction),
  }));
  check('T1 the gear shows without hover', found.gears.length > 0 && found.gears.every(o => o > 0.3), JSON.stringify(found.gears));
  check('T2 resize edges let a vertical swipe scroll the page', found.edges.length > 0 && found.edges.every(t => t === 'pan-y'), JSON.stringify(found.edges));
  // T3: a vertical swipe that starts on a float's resize edge scrolls; it doesn't resize the float.
  const w = content(await h.snapshot()).find(c => c.type === 'iframe-widget' && /width=4[246]%/.test(c.text));
  const sel = `[data-testid^=widget-resize][data-widget-key="${w.key}"]`;
  await h.scrollTo(sel);
  await h.frames(3);
  const e = await h.rect(sel);
  await h.resetUpdates();
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: e.cx, y: e.cy }] });
  for (let i = 1; i <= 15; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: e.cx, y: e.cy - (i * 10) }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach();
  await h.frames(4);
  check('T3 a vertical swipe from a resize edge does not resize', (await h.updates()).length === 0 && (await h.widgetText(w.key)) === w.text, w.text);
  await h.invariants('T3');
  check('no console errors on the touch screen', h.errors.length === 0, h.errors.join(' || '));
  await h.close();
}

const browser = await chromium.launch({
  // PW_CHROMIUM (exp3): a Chrome binary to use instead of Google Chrome (the Mac Studio has Chrome for Testing).
  ...(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : { channel: 'chrome' }),
  headless: true, args: ['--mute-audio'],
});
try {
  const groups = {
    mainChecks, shrinkWarningChecks, bottomChecks, reviewChecks, landingChecks, edgeChecks, touchChecks, narrowChecks, phoneChecks,
    wideChecks, mvp1Checks,
  };
  const only = (process.env.ONLY || '').toLowerCase().split(',').filter(Boolean);
  for (const [name, run] of Object.entries(groups)) {
    if (!only.length || only.some(word => name.toLowerCase().startsWith(word))) await run(browser);
  }
} finally {
  await browser.close();
}
const failed = results.filter(r => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed. Screenshots: ${OUT}`);
process.exit(failed.length ? 1 : 0);
