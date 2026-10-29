// EXPERIMENT (experiment/iframe-layout-ronny-exp2): quick check of the gear menu, bottom alignment and the
// Post tab showing the Editor tab's edits, against a running dev server. Muted headless Chrome, always closed.
//   node experiments/iframe-layout/widget-drag/new-features-check.mjs
import os from 'os';
import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const BASE = process.env.BASE_URL || 'http://localhost:3000';
// EDITOR_PATH (exp3): which drag editor to check. Experiment 2's by default; Experiment 3's AI Futures
// editor is /experiment-widget-blocks-7qunirv1o86fgfg7k1e9bru6e/editor. Its Post tab is the same path without /editor.
const EDITOR_PATH = process.env.EDITOR_PATH || '/experiment-widget-drag-rrjhoz6rhigvo14qsbixz68ut/editor';
const POST_PATH = EDITOR_PATH.replace(/\/editor$/, '');
const EDITOR = `${BASE}${EDITOR_PATH}`;
const OUT = process.env.OUT || fs.mkdtempSync(path.join(os.tmpdir(), 'widget-new-features-'));
let failed = 0;
const check = (name, ok, detail = '') => { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` :: ${detail}` : ''}`); };

const browser = await chromium.launch({
  // PW_CHROMIUM (exp3): a Chrome binary to use instead of Google Chrome (the Mac Studio has Chrome for Testing).
  ...(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : { channel: 'chrome' }),
  headless: true, args: ['--mute-audio'],
});
try {
  const context = await browser.newContext({ viewport: { width: 1024, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error' && !/report-only Content Security Policy/.test(m.text()) && !/type3\.audio/.test(m.location()?.url ?? '')) errors.push(`${m.text().slice(0, 150)} (${(m.location()?.url ?? '').slice(0, 80)})`); });
  page.on('pageerror', e => errors.push(`pageerror: ${e.message.slice(0, 200)}`));
  page.on('dialog', d => d.accept());
  await page.goto(EDITOR, { waitUntil: 'domcontentloaded', timeout: 240000 });
  await page.waitForSelector('[data-testid=widget-overlay]', { state: 'attached', timeout: 240000 });
  await page.waitForTimeout(7000);

  // The fixed-width widget's key, by its layout tag.
  const widgetText = (key) => page.evaluate((key) => {
    const ed = document.querySelector('[data-lexical-editor]').__lexicalEditor;
    return ed.getEditorState().read(() => ed._editorState._nodeMap.get(key)?.getTextContent().split('\n')[0]);
  }, key);
  const fixed = await page.evaluate(() => {
    const ed = document.querySelector('[data-lexical-editor]').__lexicalEditor;
    let found = null;
    ed.getEditorState().read(() => {
      for (const [key, node] of ed._editorState._nodeMap) {
        if (node.getType?.() === 'iframe-widget' && /position=right width=50%/.test(node.getTextContent())) found = key;
      }
    });
    return found;
  });
  check('found the fixed-width widget', !!fixed, String(fixed));

  // Gear: opens the menu; Left, then Bottom.
  const gear = `[data-testid=widget-options][data-widget-key="${fixed}"]`;
  await page.evaluate((sel) => document.querySelector(sel).scrollIntoView({ block: 'center' }), gear);
  await page.waitForTimeout(300);
  await page.hover(`[data-testid=widget-overlay][data-widget-key="${fixed}"]`);
  await page.click(gear);
  await page.waitForSelector('[data-testid=widget-options-menu]', { timeout: 3000 });
  check('the gear opens the options', true);
  await page.click('[data-testid=widget-options-menu] [data-option=left]');
  await page.waitForTimeout(400);
  const afterLeft = await widgetText(fixed);
  await page.click('[data-testid=widget-options-menu] [data-option=bottom]');
  await page.waitForTimeout(400);
  // At 25% it's shorter than its paragraph, so lining up with the paragraph's bottom moves it.
  await page.click('[data-testid=widget-options-menu] [data-option="25%"]');
  await page.waitForTimeout(1500);
  const afterBottom = await widgetText(fixed);
  check('Left, Bottom and 25% are written to the widget', /position=left width=50%/.test(afterLeft) && /position=left width=25% align=bottom/.test(afterBottom), `${afterLeft} / ${afterBottom}`);
  const editorAlign = await page.evaluate((key) => {
    const ed = document.querySelector('[data-lexical-editor]').__lexicalEditor;
    const spacer = ed.getElementByKey(key);
    let next = spacer.nextElementSibling;
    while (next && next.getBoundingClientRect().height < 1) next = next.nextElementSibling;
    const s = spacer.getBoundingClientRect(), p = next.getBoundingClientRect();
    return { push: spacer.dataset.lwBottomPush, widgetBottom: Math.round(s.bottom), paragraphTop: Math.round(p.top), paragraphBottom: Math.round(p.bottom), float: getComputedStyle(spacer).float };
  }, fixed);
  check('in the editor its bottom lines up with its paragraph\'s', editorAlign.float === 'left' && Number(editorAlign.push) > 0
    && editorAlign.paragraphBottom - editorAlign.widgetBottom >= -1 && editorAlign.paragraphBottom - editorAlign.widgetBottom < 40, JSON.stringify(editorAlign));
  await page.screenshot({ path: path.join(OUT, 'editor-bottom.png') });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  check('Escape closes the options', !(await page.$('[data-testid=widget-options-menu]')));

  // The Post tab shows the edit.
  await page.waitForTimeout(800);
  await Promise.all([page.waitForURL(/widgetDrag=1|widgetBlocks=/, { timeout: 240000 }), page.click('a:text-is("Post")')]);
  await page.waitForSelector('[data-testid=widget-drag-post-body] iframe[data-lexical-iframe-widget]', { timeout: 240000 });
  await page.waitForTimeout(5000);
  const post = await page.evaluate(() => {
    const frames = [...document.querySelectorAll('[data-testid=widget-drag-post-body] iframe[data-lexical-iframe-widget]')];
    const fixedFrame = frames.find(f => /620px-wide box/.test(f.getAttribute('srcdoc') ?? ''));
    if (!fixedFrame) return { frames: frames.length };
    const container = fixedFrame.closest('.iframe-widget');
    let next = container.nextElementSibling;
    while (next && next.getBoundingClientRect().height < 1) next = next.nextElementSibling;
    const f = fixedFrame.getBoundingClientRect(), p = next.getBoundingClientRect();
    return { frames: frames.length, float: getComputedStyle(fixedFrame).float, push: fixedFrame.dataset.lwBottomPush,
      widgetBottom: Math.round(f.bottom), paragraphBottom: Math.round(p.bottom), widthButtons: [...document.querySelectorAll('button')].filter(b => /^(Normal|Medium|Wide) \(/.test(b.textContent)).length };
  });
  check('the Post tab shows the edit: left, lined up with its paragraph\'s bottom', post.frames === 7 && post.float === 'left' && Number(post.push) > 0
    && post.paragraphBottom - post.widgetBottom >= -1 && post.paragraphBottom - post.widgetBottom < 40, JSON.stringify(post));
  check('the Post tab has no text width choice', post.widthButtons === 0, String(post.widthButtons));
  await page.evaluate(() => document.querySelector('[data-testid=widget-drag-post-body] iframe[srcdoc*="620px-wide box"]')?.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, 'post-bottom.png') });

  // Back in the editor the edit is still there; Reset puts the post back.
  await Promise.all([page.waitForURL(/\/editor/, { timeout: 240000 }), page.click('a:text-is("Editor")')]);
  await page.waitForSelector('[data-testid=widget-overlay]', { state: 'attached', timeout: 240000 });
  await page.waitForTimeout(4000);
  const kept = await page.evaluate(() => {
    const ed = document.querySelector('[data-lexical-editor]').__lexicalEditor;
    let text = null;
    ed.getEditorState().read(() => {
      for (const [, node] of ed._editorState._nodeMap) {
        if (node.getType?.() === 'iframe-widget' && /620px-wide box/.test(node.getTextContent())) text = node.getTextContent().split('\n')[0];
      }
    });
    return text;
  });
  check('the editor still has the edit', /position=left width=25% align=bottom/.test(kept ?? ''), String(kept));
  await Promise.all([page.waitForEvent('load', { timeout: 240000 }), page.click('[data-testid=widget-drag-reset]')]);
  await page.waitForSelector('[data-testid=widget-overlay]', { state: 'attached', timeout: 240000 });
  await page.waitForTimeout(4000);
  const reset = await page.evaluate(() => {
    const ed = document.querySelector('[data-lexical-editor]').__lexicalEditor;
    let text = null;
    ed.getEditorState().read(() => {
      for (const [, node] of ed._editorState._nodeMap) {
        if (node.getType?.() === 'iframe-widget' && /620px-wide box/.test(node.getTextContent())) text = node.getTextContent().split('\n')[0];
      }
    });
    return text;
  });
  check('Reset puts the post back', /position=right width=50%">?$/.test(reset ?? '') || /content="position=right width=50%"/.test(reset ?? ''), String(reset));
  check('no console errors', errors.length === 0, errors.join(' || '));
} finally {
  await browser.close();
}
console.log(failed ? `${failed} FAILED. Screenshots: ${OUT}` : `ALL PASSED. Screenshots: ${OUT}`);
process.exit(failed ? 1 : 0);
