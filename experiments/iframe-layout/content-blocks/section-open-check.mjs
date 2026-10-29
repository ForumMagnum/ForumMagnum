// EXPERIMENT (experiment/iframe-layout-ronny-exp3).
// Collapsible sections beside a left widget are placed as they look OPEN (Ronny, Oct 29 2026: "if the
// open state would not fit, then the closed state should not fit either"). Checks, in the editor and
// the Post tab at several widths, that opening or closing a section never moves it:
// - the demo's short section sits beside the widget, closed and open;
// - made long (typed in the editor), it goes below the widget open AND closed, in the editor and the post.
// Needs the dev server (BASE_URL, default http://localhost:3000). Uses the installed Chrome, headless and
// muted; set PW_CHROMIUM to a Chrome binary where there is none (the Studio: Chrome for Testing 156).
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const ROUTE = '/experiment-widget-blocks-7qunirv1o86fgfg7k1e9bru6e/blocks';
const WIDTHS = (process.env.WIDTHS || '1280,1024,900').split(',').map(Number);
const FILLER = 'Filler sentence to make this collapsible section long, so that it hangs well below the widget beside it. ';
const POST = '[data-testid=widget-drag-post-body]';
const EDITOR = '[data-lexical-editor]';

const browser = await chromium.launch({
  ...(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : { channel: 'chrome' }),
  headless: true,
  args: ['--mute-audio'],
});
let failures = 0;
const report = (ok, name, detail) => {
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${!ok && detail ? ` :: ${JSON.stringify(detail)}` : ''}`);
};

// The first section, and whether it sits beside the last left widget before it.
const measure = (scope) => {
  const r = e => { const b = e.getBoundingClientRect(); return { x: Math.round(b.left), w: Math.round(b.width), top: Math.round(b.top + scrollY), bottom: Math.round(b.bottom + scrollY) }; };
  const d = document.querySelector(scope).querySelector('.detailsBlock');
  const root = d.parentElement;
  const floats = [...root.querySelectorAll(':scope > .iframe-widget > iframe.lwFloatedWidget, :scope > .iframe-widget-code[data-lw-wraps]')]
    .filter(f => getComputedStyle(f).float === 'left' && (f.compareDocumentPosition(d) & Node.DOCUMENT_POSITION_FOLLOWING));
  const w = floats[floats.length - 1];
  const box = r(d);
  const widget = w ? r(w) : null;
  const open = d.matches('details') ? d.open : !d.classList.contains('detailsBlockClosed');
  return { open, beside: !!widget && box.x >= widget.x + widget.w - 1, below: d.hasAttribute('data-lw-below'), box, widget };
};
const setPostOpen = (open) => (scope) => { document.querySelector(scope).querySelector('details.detailsBlock').open = open; };

async function openEditor(page) {
  await page.goto(`${BASE}${ROUTE}/editor`, { waitUntil: 'load' });
  await page.waitForSelector(`${EDITOR} > .detailsBlock`);
  await page.waitForTimeout(8000);
}
async function openPost(page) {
  await page.goto(`${BASE}${ROUTE}`, { waitUntil: 'load' });
  await page.waitForSelector(`${POST} details.detailsBlock`);
  await page.waitForTimeout(4000);
}
async function postBothWays(page, label, expectBeside) {
  const closed = await page.evaluate(measure, POST);
  await page.evaluate(setPostOpen(true), POST);
  await page.waitForTimeout(1200);
  const opened = await page.evaluate(measure, POST);
  await page.evaluate(setPostOpen(false), POST);
  await page.waitForTimeout(1200);
  const reclosed = await page.evaluate(measure, POST);
  report(!closed.open && closed.beside === expectBeside, `${label}: closed, ${expectBeside ? 'beside' : 'below'} the widget`, closed);
  report(opened.open && opened.beside === expectBeside && opened.box.x === closed.box.x && opened.box.w === closed.box.w,
    `${label}: opening it doesn't move it`, { closed, opened });
  report(reclosed.box.x === closed.box.x && reclosed.box.w === closed.box.w, `${label}: closing it again doesn't move it`, { closed, reclosed });
}

try {
  for (const width of WIDTHS) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();

    // The demo's short section: beside the widget everywhere, open or closed.
    await openEditor(page);
    const editorShort = await page.evaluate(measure, EDITOR);
    report(editorShort.open && editorShort.beside, `editor ${width}: short section beside the widget`, editorShort);
    await openPost(page);
    await postBothWays(page, `post ${width} short`, true);

    // Made long in the editor (open there): it goes below the widget...
    await openEditor(page);
    const section = page.locator(`${EDITOR} > .detailsBlock`).first();
    const lastP = section.locator(':scope > .detailsBlockContent > p').last();
    await lastP.scrollIntoViewIfNeeded();
    await lastP.click();
    await page.keyboard.press('End');
    // One long paragraph (Enter in this editor currently jumps to the footnotes, a separate bug).
    await page.keyboard.type(' ' + FILLER.repeat(8), { delay: 0 });
    await page.waitForTimeout(1500);
    const editorLong = await page.evaluate(measure, EDITOR);
    report((await section.textContent()).includes('Filler sentence'), `editor ${width}: the typing went into the section`);
    report(editorLong.open && !editorLong.beside && editorLong.below, `editor ${width}: long open section below the widget`, editorLong);
    // ...and stays below when closed (click the marker at the title's left edge).
    // The marker sits in the title's left gutter, outside the title's text.
    const title = section.locator(':scope > .detailsBlockTitle');
    await title.scrollIntoViewIfNeeded();
    const tb = await title.boundingBox();
    await page.mouse.click(tb.x + 6, tb.y + tb.height / 2);
    await page.waitForTimeout(1500);
    const editorClosed = await page.evaluate(measure, EDITOR);
    report(!editorClosed.open && !editorClosed.beside && editorClosed.box.x === editorLong.box.x && editorClosed.box.w === editorLong.box.w,
      `editor ${width}: closing the long section doesn't move it`, { editorLong, editorClosed });
    await page.waitForTimeout(1500);

    // The Post tab shows the edit: below the widget, closed and open.
    await openPost(page);
    await postBothWays(page, `post ${width} long`, false);
    await context.close();
  }
} finally {
  await browser.close();
}
console.log(failures ? `${failures} FAILED` : 'ALL PASSED');
process.exit(failures ? 1 : 0);
