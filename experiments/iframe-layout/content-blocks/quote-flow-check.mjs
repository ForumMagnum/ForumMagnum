// EXPERIMENT (experiment/iframe-layout-ronny-exp3).
// A quote, collapsible section or list is a box beside a LEFT widget (its bar, triangle or markers stay out of
// the see-through widget) and flows like text beside a RIGHT widget. Which applies goes by the nearest widget
// above it (the sliver guard marks it), not by any left widget earlier in the post: the CSS rule that said
// "after any left widget" boxed the quote beside the blocks demo's right widget too, so lengthened, it stayed
// narrow below the widget (Ronny, Oct 30 2026: "A quote on the left beside a widget on the right. if it gets
// longer, it does not flow"). Checks, in the blocks demo at 1280px:
// - the quote beside the left widget is a box, the one beside the right widget isn't;
// - typed longer in the editor, the right widget's quote runs the full column width below the widget;
// - the same on the Post tab, which shows the edit.
// Needs the dev server (BASE_URL, default http://localhost:3001, the working copy; 3000 is Ronny's play
// copy, never tested against). Uses the installed Chrome, headless and muted; set PW_CHROMIUM to a Chrome
// binary where there is none.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const BASE = process.env.BASE_URL || 'http://localhost:3001';
const POST = '/experiment-widget-blocks-7qunirv1o86fgfg7k1e9bru6e/blocks';
const MORE = ' Typed longer, the quote keeps going well past the bottom of the widget beside it, so its lines'
  + ' below the widget should run the full width of the column, the way any paragraph does beside a right'
  + ' widget, instead of staying as narrow as they were next to it. One more sentence to make sure it'
  + ' reaches far enough down.';
let failures = 0;
const check = (name, ok, detail) => {
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${!ok && detail !== undefined ? ` :: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}` : ''}`);
};

// The quote whose text starts with `start`: whether it's a box, and how its lines below the widget nearest
// above it (on the right) sit: the widest line's right edge against the widget's left edge.
const QUOTE = ([start, view]) => {
  const root = view === 'editor' ? document.querySelector('[data-lexical-editor]') : document.querySelector('[data-testid=widget-drag-post-body]');
  const quote = [...root.querySelectorAll('blockquote')].find(q => q.textContent.trim().startsWith(start));
  if (!quote) return null;
  let el = quote.previousElementSibling;
  while (el && !el.matches('.iframe-widget-code[data-lw-wraps], .iframe-widget:has(> .lwFloatedWidget)')) el = el.previousElementSibling;
  const widget = (el?.matches('.iframe-widget') ? el.querySelector('iframe') : el)?.getBoundingClientRect();
  const lines = [];
  const walker = document.createTreeWalker(quote, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const range = document.createRange(); range.selectNodeContents(n);
    for (const r of range.getClientRects()) if (r.width > 1) lines.push({ top: r.top, right: r.right });
  }
  const below = widget ? lines.filter(l => l.top > widget.bottom + 20) : [];
  return {
    box: getComputedStyle(quote).display === 'flow-root',
    widgetLeft: widget && Math.round(widget.left),
    belowLines: below.length,
    widestBelow: below.length ? Math.round(Math.max(...below.map(l => l.right))) : null,
  };
};

const browser = await chromium.launch({
  ...(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : { channel: 'chrome' }),
  headless: true,
  args: ['--mute-audio'],
});
try {
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  await page.goto(`${BASE}${POST}/editor`, { waitUntil: 'load', timeout: 240000 });
  await page.waitForSelector('[data-testid=widget-overlay]', { state: 'attached', timeout: 240000 });
  await page.waitForTimeout(7000);

  const left = await page.evaluate(QUOTE, ['A quote beside a left widget', 'editor']);
  const right = await page.evaluate(QUOTE, ['This quote flows beside a right widget', 'editor']);
  check('the quote beside the left widget is a box', left?.box === true, left);
  check('the quote beside the right widget flows like text (no box)', right?.box === false, right);

  // Type more at the end of the right widget's quote.
  const placed = await page.evaluate(() => {
    const root = document.querySelector('[data-lexical-editor]');
    const editor = root.__lexicalEditor;
    const quote = [...root.querySelectorAll('blockquote')].find(q => q.textContent.trim().startsWith('This quote flows beside a right widget'));
    const last = quote?.querySelector(':scope > p:last-child') ?? quote;
    const key = last?.[`__lexicalKey_${editor._key}`];
    if (!key) return false;
    last.scrollIntoView({ block: 'center' });
    root.focus();
    editor.update(() => { editor.getEditorState()._nodeMap.get(key).getLatest().selectEnd(); });
    return true;
  });
  check('found the end of the right widget\'s quote', placed);
  await page.waitForTimeout(300);
  await page.keyboard.type(MORE, { delay: 2 });
  await page.waitForTimeout(1500);
  const longer = await page.evaluate(QUOTE, ['This quote flows beside a right widget', 'editor']);
  check('typed longer in the editor: its lines below the widget run past the widget\'s left edge (full width)',
    longer && !longer.box && longer.belowLines > 0 && longer.widestBelow > longer.widgetLeft + 40, longer);

  // The Post tab shows the edit.
  await page.goto(`${BASE}${POST}`, { waitUntil: 'load', timeout: 240000 });
  await page.waitForSelector('[data-testid=widget-drag-post-body] iframe.lwFloatedWidget', { timeout: 240000 });
  await page.waitForTimeout(5000);
  const post = await page.evaluate(QUOTE, ['This quote flows beside a right widget', 'post']);
  const postLeft = await page.evaluate(QUOTE, ['A quote beside a left widget', 'post']);
  check('the Post tab: the longer quote runs full width below the right widget', post && !post.box && post.belowLines > 0
    && post.widestBelow > post.widgetLeft + 40, post);
  check('the Post tab: the quote beside the left widget is still a box', postLeft?.box === true, postLeft);
} finally {
  await browser.close();
}
console.log(failures ? `\n${failures} FAILED` : '\nall passed');
process.exit(failures ? 1 : 0);
