// EXPERIMENT (experiment/iframe-layout-ronny-exp3).
// Backspace and Delete never delete or change a widget from a text caret or the gap next to it (Ronny,
// Oct 29 2026: "If my cursor is on text, it should never delete a widget"); at a widget they join the text
// on either side instead (widgetDeleteGuard.ts). Checks, in the blocks demo's editor:
// - Backspace before the first letter of the paragraph after a widget (Ronny's case, the bottom-aligned
//   widget) joins it onto the paragraph before the widget; the widget, unchanged, sits in front of the
//   joined paragraph, still lined up with its end; the caret is where they meet; one undo puts it back;
// - Backspace in the gap after that widget, and Delete after the last letter of the paragraph before it,
//   do the same;
// - a full-width widget (AI Futures demo) ends up after the joined paragraph;
// - a click on a widget's grip selects it (focus, a ring), and Backspace or Delete then removes it, one
//   undo bringing it back (the gear menu has no Delete);
// - a text selection that runs across a widget still deletes it.
// Needs the dev server (BASE_URL, default http://localhost:3001, the working copy; 3000 is Ronny's play
// copy, never tested against). Uses the installed Chrome, headless and muted; set PW_CHROMIUM to a Chrome
// binary where there is none.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const BASE = process.env.BASE_URL || 'http://localhost:3001';
const BLOCKS = '/experiment-widget-blocks-7qunirv1o86fgfg7k1e9bru6e/blocks/editor';
const AI_FUTURES = '/experiment-widget-blocks-7qunirv1o86fgfg7k1e9bru6e/editor';
const P1 = 'A widget can also line up with the bottom';
const P2 = 'This paragraph ends level with the bottom';
const UNDO = process.platform === 'darwin' ? 'Meta+z' : 'Control+z';
let failures = 0;
const check = (name, ok, detail) => {
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${!ok && detail !== undefined ? ` :: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}` : ''}`);
};

// The editor's top-level blocks, gaps left out, and every widget's code.
const snapshot = () => {
  const root = document.querySelector('[data-lexical-editor]');
  return {
    blocks: [...root.children].filter(k => !k.matches('.sentinel-paragraph')).map(k => k.matches('.iframe-widget-code')
      ? `WIDGET ${(k.textContent.match(/name="lw-layout" content="([^"]*)"/) || [])[1] || 'full'}` : `${k.tagName}:${k.textContent.slice(0, 50)}`),
    codes: [...root.querySelectorAll('.iframe-widget-code')].map(w => w.textContent),
  };
};
// The caret at the start (or end) of the first top-level paragraph starting with `text`.
const caretAt = ([text, atEnd]) => {
  const p = [...document.querySelectorAll('[data-lexical-editor] > p')].find(e => e.textContent.startsWith(text));
  p.scrollIntoView({ block: 'center' });
  const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  if (atEnd) for (let n = walker.nextNode(); n; n = walker.nextNode()) node = n;
  const range = document.createRange();
  range.setStart(node, atEnd ? node.length : 0);
  range.collapse(true);
  const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
  document.querySelector('[data-lexical-editor]').focus();
};
// The caret in the gap right after the top-level widget whose layout tag matches `tag`.
const caretInGapAfter = (tag) => {
  const root = document.querySelector('[data-lexical-editor]');
  const editor = root.__lexicalEditor;
  const widget = [...root.querySelectorAll(':scope > .iframe-widget-code')].find(w => w.textContent.includes(tag));
  const gap = widget.nextElementSibling;
  if (!gap?.matches('.sentinel-paragraph')) return false;
  gap.scrollIntoView({ block: 'center' });
  root.focus();
  const key = gap[`__lexicalKey_${editor._key}`];
  editor.update(() => { editor.getEditorState()._nodeMap.get(key).selectStart(); });
  return true;
};
const browser = await chromium.launch({
  ...(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : { channel: 'chrome' }),
  headless: true,
  args: ['--mute-audio'],
});
const open = async (path) => {
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  await page.goto(`${BASE}${path}`, { waitUntil: 'load', timeout: 240000 });
  await page.waitForSelector('[data-lexical-editor] .iframe-widget-code', { timeout: 240000 });
  await page.waitForTimeout(7000);
  return page;
};
const indexOf = (blocks, start) => blocks.findIndex(b => b.startsWith(`P:${start}`));

try {
  // Ronny's case, then the gap, then Delete from the other side: each joins the two paragraphs.
  for (const how of ['Backspace at the start of the paragraph after the widget', 'Backspace in the gap after the widget', 'Delete at the end of the paragraph before the widget']) {
    const page = await open(BLOCKS);
    const before = await page.evaluate(snapshot);
    if (how.startsWith('Delete')) await page.evaluate(caretAt, [P1, true]);
    else if (how.includes('gap')) check(`${how}: the caret is in the gap`, await page.evaluate(caretInGapAfter, 'align=bottom'));
    else await page.evaluate(caretAt, [P2, false]);
    await page.waitForTimeout(300);
    await page.keyboard.press(how.startsWith('Delete') ? 'Delete' : 'Backspace');
    await page.waitForTimeout(800);
    // Where the caret is: a marker typed there lands between the two texts.
    await page.keyboard.type('|');
    await page.waitForTimeout(800);
    const after = await page.evaluate(snapshot);
    const joined = after.blocks.find(b => b.startsWith(`P:${P1}`));
    const joinedText = await page.evaluate((start) => [...document.querySelectorAll('[data-lexical-editor] > p')].find(p => p.textContent.startsWith(start))?.textContent ?? '', P1);
    const at = indexOf(after.blocks, P1);
    check(`${how}: every widget is still there, its code unchanged`, JSON.stringify(after.codes) === JSON.stringify(before.codes), { before: before.codes.length, after: after.codes.length });
    check(`${how}: the two paragraphs are one, joined where the caret is`,
      !!joined && joinedText.includes(`it.|${P2}`) && indexOf(after.blocks, P2) === -1, { joinedText: joinedText.slice(200, 300) });
    check(`${how}: the widget sits in front of the joined paragraph, still lined up with its end`,
      at > 0 && /align=bottom/.test(after.blocks[at - 1]), after.blocks.slice(Math.max(0, at - 3), at + 2));
    await page.keyboard.press(UNDO);
    await page.waitForTimeout(500);
    await page.keyboard.press(UNDO);
    await page.waitForTimeout(1200);
    const undone = await page.evaluate(snapshot);
    check(`${how}: undo puts the paragraphs and the widget back`,
      JSON.stringify(undone.blocks) === JSON.stringify(before.blocks) && JSON.stringify(undone.codes) === JSON.stringify(before.codes),
      { undone: undone.blocks.slice(indexOf(undone.blocks, P1) - 1, indexOf(undone.blocks, P1) + 3) });
    await page.context().close();
  }

  // A full-width widget ends up after the joined paragraph (the text after it moves up to the text before).
  {
    const page = await open(AI_FUTURES);
    const found = await page.evaluate(() => {
      const root = document.querySelector('[data-lexical-editor]');
      const content = (el, dir) => { let n = dir < 0 ? el.previousElementSibling : el.nextElementSibling; while (n?.matches('.sentinel-paragraph')) n = dir < 0 ? n.previousElementSibling : n.nextElementSibling; return n; };
      const w = [...root.querySelectorAll(':scope > .iframe-widget-code')].find(w => !/position=(left|right)/.test(w.textContent)
        && content(w, -1)?.matches('p') && content(w, 1)?.matches('p') && content(w, -1).textContent.trim() && content(w, 1).textContent.trim());
      return w ? { before: content(w, -1).textContent.slice(0, 40), after: content(w, 1).textContent.slice(0, 40) } : null;
    });
    if (!found) check('AI Futures demo has a full-width widget between two paragraphs', false);
    else {
      const before = await page.evaluate(snapshot);
      await page.evaluate(caretAt, [found.after, false]);
      await page.waitForTimeout(300);
      await page.keyboard.press('Backspace');
      await page.waitForTimeout(1000);
      const after = await page.evaluate(snapshot);
      const at = indexOf(after.blocks, found.before);
      check('full-width widget: Backspace joins the paragraphs and the widget follows the joined one',
        at >= 0 && indexOf(after.blocks, found.after) === -1 && after.blocks[at + 1]?.startsWith('WIDGET')
        && JSON.stringify(after.codes) === JSON.stringify(before.codes), after.blocks.slice(Math.max(0, at - 1), at + 3));
    }
    await page.context().close();
  }

  // Deleting on purpose (Ronny: "Grip, then Delete"): a click on the grip selects the widget (focus and a
  // ring), and then Backspace or Delete removes it, and only it; one undo brings it back.
  const overlayKeyOf = () => {
    const root = document.querySelector('[data-lexical-editor]');
    const w = [...root.querySelectorAll(':scope > .iframe-widget-code')].find(s => /align=bottom/.test(s.textContent));
    w.scrollIntoView({ block: 'center' });
    const s = w.getBoundingClientRect();
    const overlay = [...document.querySelectorAll('[data-testid=widget-overlay]')].find(o => {
      const a = o.getBoundingClientRect(); return Math.abs(a.top - s.top) < 2 && Math.abs(a.left - s.left) < 2;
    });
    return { key: overlay?.dataset.widgetKey, code: w.textContent };
  };
  for (const key of ['Backspace', 'Delete']) {
    const page = await open(BLOCKS);
    const before = await page.evaluate(snapshot);
    const widget = await page.evaluate(overlayKeyOf);
    await page.locator(`[data-testid=widget-overlay][data-widget-key="${widget.key}"]`).hover();
    await page.locator(`[data-testid=widget-grip][data-widget-key="${widget.key}"]`).click();
    await page.waitForTimeout(400);
    const selected = await page.evaluate((k) => {
      const grip = document.querySelector(`[data-testid=widget-grip][data-widget-key="${k}"]`);
      const cs = getComputedStyle(document.querySelector(`[data-testid=widget-overlay][data-widget-key="${k}"]`));
      return { focused: document.activeElement === grip, ring: cs.outlineStyle === 'solid' && parseFloat(cs.outlineWidth) >= 2 };
    }, widget.key);
    check(`clicking a widget's grip selects it: the grip has the focus, the widget a ring`, selected.focused && selected.ring, selected);
    await page.keyboard.press(key);
    await page.waitForTimeout(1000);
    const after = await page.evaluate(snapshot);
    check(`${key} with the grip selected deletes that widget and nothing else`,
      after.codes.length === before.codes.length - 1 && !after.codes.includes(widget.code)
      && indexOf(after.blocks, P1) >= 0 && indexOf(after.blocks, P2) >= 0, { before: before.codes.length, after: after.codes.length });
    await page.keyboard.press(UNDO);
    await page.waitForTimeout(1200);
    const undone = await page.evaluate(snapshot);
    check(`${key}: one undo brings the widget back`, JSON.stringify(undone.codes) === JSON.stringify(before.codes), { undone: undone.codes.length });
    await page.context().close();
  }

  // The gear menu has no Delete: the grip does that.
  {
    const page = await open(BLOCKS);
    const top = await page.evaluate(overlayKeyOf);
    await page.locator(`[data-testid=widget-overlay][data-widget-key="${top.key}"]`).hover();
    await page.locator(`[data-testid=widget-options][data-widget-key="${top.key}"]`).click();
    await page.waitForTimeout(300);
    const options = await page.locator('[data-testid=widget-options-menu] [data-option]').evaluateAll(bs => bs.map(b => b.dataset.option));
    check('the gear menu has no Delete (the grip does that)', options.length > 0 && !options.includes('delete'), options);
    await page.context().close();
  }

  // A text selection that runs across a widget still deletes it (it was selected).
  {
    const page = await open(BLOCKS);
    const before = await page.evaluate(snapshot);
    await page.evaluate(([from, to]) => {
      const find = t => [...document.querySelectorAll('[data-lexical-editor] > p')].find(e => e.textContent.startsWith(t));
      const a = document.createTreeWalker(find(from), NodeFilter.SHOW_TEXT).nextNode();
      const b = document.createTreeWalker(find(to), NodeFilter.SHOW_TEXT).nextNode();
      find(from).scrollIntoView({ block: 'center' });
      const sel = window.getSelection(); sel.removeAllRanges();
      const range = document.createRange(); range.setStart(a, 10); range.setEnd(b, 10); sel.addRange(range);
      document.querySelector('[data-lexical-editor]').focus();
    }, [P1, P2]);
    await page.waitForTimeout(400);
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(800);
    const after = await page.evaluate(snapshot);
    check('a text selection across a widget still deletes it', after.codes.length === before.codes.length - 1, { before: before.codes.length, after: after.codes.length });
    await page.context().close();
  }
} finally {
  await browser.close();
}
console.log(failures ? `${failures} FAILED` : 'ALL PASSED');
process.exit(failures ? 1 : 0);
