// EXPERIMENT (experiment/iframe-layout-ronny-exp3).
// Widgets never sit inside another block (Ronny, Oct 29 2026: "get rid of any functionality for putting
// widgets inside of other content blocks... use the beside a widget interactions"). The editor moves one
// out to just before the post's block that holds it ($hoistWidget in IframeWidgetPlugin). Checks:
// - post HTML with widgets inside a quote, a list item, a collapsible section, AI content and a table
//   cell, opened in the editor: every widget comes out, to just before its block, still floating beside it;
// - a widget moved into a block by the editor (as a paste would put it there) comes straight back out;
// - the Post tab, given that HTML as it is (old HTML), floats none of the widgets inside blocks.
// Needs the dev server (BASE_URL, default http://localhost:3001, the working copy; 3000 is Ronny's play
// copy, never tested against). Uses the installed Chrome, headless and muted; set PW_CHROMIUM to a Chrome
// binary where there is none.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const BASE = process.env.BASE_URL || 'http://localhost:3001';
const ROUTE = '/experiment-widget-blocks-7qunirv1o86fgfg7k1e9bru6e/blocks';
const STORAGE_KEY = 'lwWidgetBlocksEdits:blocks';
let failures = 0;
const check = (name, ok, detail) => {
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${!ok && detail !== undefined ? ` :: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}` : ''}`);
};

// The demo's HTML with a copy of its first widget put inside the first block of each kind.
const { base, html } = await (await fetch(`${BASE}${ROUTE}/default-post`)).json();
const widget = html.match(/<iframe data-lexical-iframe-widget[\s\S]*?<\/iframe>/)[0].replace(/ data-widget-id="[^"]*"/, '');
const HOLDERS = [
  ['quote', /<blockquote[^>]*>/],
  ['list item', /<li(?![^>]*data-footnote)[^>]*>/],
  ['section', /<div class="detailsBlockContent"[^>]*>/],
  ['AI content', /<div class="llm-content-block-content"[^>]*>/],
  ['table cell', /<td[^>]*>/],
];
let specimen = html;
for (const [label, opening] of HOLDERS) {
  const match = specimen.match(opening);
  if (!match) { check(`the demo has a ${label} to put a widget in`, false); continue; }
  specimen = specimen.replace(opening, `${match[0]}${widget}`);
}
const widgetsInDemo = (html.match(/<iframe data-lexical-iframe-widget/g) || []).length;

// Where each widget sits: top-level or inside a block, the block right after it, and whether it floats.
const placement = () => {
  const root = document.querySelector('[data-lexical-editor]');
  const holderKind = el => el.closest('.llm-content-block') ? 'AI content' : el.closest('.detailsBlock') ? 'section'
    : el.closest('li') ? 'list item' : el.closest('blockquote') ? 'quote' : el.closest('td, th') ? 'table cell' : 'other';
  return [...root.querySelectorAll('.iframe-widget-code')].map(w => {
    let next = w.nextElementSibling;
    while (next?.matches('.sentinel-paragraph')) next = next.nextElementSibling;
    return {
      topLevel: w.parentElement === root,
      inside: w.parentElement === root ? null : holderKind(w.parentElement),
      next: next ? (next.matches('blockquote') ? 'quote' : next.matches('ul, ol') ? 'list' : next.matches('.detailsBlock') ? 'section'
        : next.matches('.llm-content-block') ? 'AI content' : next.matches('.table-scrollable-wrapper, table') || next.querySelector?.(':scope > table') ? 'table' : next.tagName) : null,
      floats: w.hasAttribute('data-lw-wraps'),
    };
  });
};

const browser = await chromium.launch({
  ...(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : { channel: 'chrome' }),
  headless: true,
  args: ['--mute-audio'],
});
const withSpecimen = async () => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addInitScript(([key, value]) => { try { sessionStorage.setItem(key, value); } catch { /* none */ } },
    [STORAGE_KEY, JSON.stringify({ base, html: specimen })]);
  return context.newPage();
};
try {
  // Opened in the editor: every widget is out of its block, just before it, floating beside it.
  {
    const page = await withSpecimen();
    await page.goto(`${BASE}${ROUTE}/editor?specimen`, { waitUntil: 'load', timeout: 240000 });
    await page.waitForSelector('[data-lexical-editor] .iframe-widget-code', { timeout: 240000 });
    await page.waitForTimeout(8000);
    const widgets = await page.evaluate(placement);
    check(`all ${widgetsInDemo + HOLDERS.length} widgets are in the editor`, widgets.length === widgetsInDemo + HOLDERS.length, widgets.length);
    check('no widget is inside another block', widgets.every(w => w.topLevel), widgets.filter(w => !w.topLevel));
    for (const kind of ['quote', 'list', 'section', 'AI content', 'table']) {
      const before = widgets.find(w => w.next === kind);
      check(`a widget sits just before the ${kind} it was in, floating beside it`, !!before && before.floats, widgets.filter(w => w.next === kind));
    }
    await page.context().close();
  }

  // Moved into a block by the editor (as a paste would): it comes straight back out.
  {
    const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
    await page.goto(`${BASE}${ROUTE}/editor`, { waitUntil: 'load', timeout: 240000 });
    await page.waitForSelector('[data-lexical-editor] .iframe-widget-code', { timeout: 240000 });
    await page.waitForTimeout(7000);
    const result = await page.evaluate(() => {
      const root = document.querySelector('[data-lexical-editor]');
      const editor = root.__lexicalEditor;
      const keyOf = el => el[`__lexicalKey_${editor._key}`];
      const widgetKey = keyOf(root.querySelector(':scope > .iframe-widget-code'));
      const quote = root.querySelector(':scope > blockquote');
      const quoteKey = keyOf(quote);
      editor.update(() => {
        const map = editor.getEditorState()._nodeMap;
        map.get(quoteKey).append(map.get(widgetKey));
      }, { discrete: true });
      const w = editor.getElementByKey(widgetKey);
      let next = w?.nextElementSibling;
      while (next?.matches('.sentinel-paragraph')) next = next.nextElementSibling;
      return { topLevel: w?.parentElement === root, beforeTheQuote: next === quote };
    });
    check('a widget moved into a quote comes straight back out, to just before it', result.topLevel && result.beforeTheQuote, result);
    await page.context().close();
  }

  // The Post tab given that HTML as it is (old HTML): no widget inside a block floats.
  {
    const page = await withSpecimen();
    await page.goto(`${BASE}${ROUTE}`, { waitUntil: 'load', timeout: 240000 });
    await page.waitForSelector('[data-testid=widget-drag-post-body] iframe', { timeout: 240000 });
    await page.waitForTimeout(6000);
    const nested = await page.evaluate(() => [...document.querySelectorAll('[data-testid=widget-drag-post-body] .iframe-widget iframe')]
      .filter(f => f.closest('blockquote, li, .detailsBlock, .llm-content-block, td, th'))
      .map(f => ({ in: f.closest('blockquote, li, .detailsBlock, .llm-content-block, td, th').tagName, float: getComputedStyle(f).float })));
    check('old HTML in the post: the widgets inside blocks are there', nested.length >= 4, nested);
    check('old HTML in the post: none of them floats', nested.every(n => n.float === 'none'), nested);
    await page.context().close();
  }
} finally {
  await browser.close();
}
console.log(failures ? `${failures} FAILED` : 'ALL PASSED');
process.exit(failures ? 1 : 0);
