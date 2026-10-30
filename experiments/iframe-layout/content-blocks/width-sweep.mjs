// Experiment 3 width sweep. Opens a demo post's Editor tab and Post tab side by side and steps the window
// width from 320 to 2560 (every 8px by default). At each width it checks:
//   1. overlaps: no text line, bordered/backgrounded box, image, embed or list marker inside a floated
//      widget's box (in either view);
//   2. hscroll: the page never scrolls sideways;
//   3. agreement: every top-level block starts at the same x, has the same width and the same first-line
//      start in the editor and the post (blocks are matched by their text);
//   4. wraps: the same number of widgets float in both views.
// Differences that come only from vertical drift (a block above is a little taller in one view, so a block
// near a widget's bottom lands beside it in one and below it in the other) are reported apart, as "drift":
// a block whose top is within 40px of a widget's bottom in either view. (The sentinel gaps that used to
// cause most of it are fixed, Oct 29 2026; the remaining block-height differences are in HANDOFF.md.)
//
// Usage (Studio: through the browser slot lock):
//   ~/lw-exp3-proto/with-slot.sh node width-sweep.mjs [--demo blocks|ai-futures] [--from 320] [--to 2560]
//     [--step 8] [--specimen spec.html] [--css extra.css] [--engine chromium|webkit] [--out result.json]
// Exit code 1 if any width has an overlap, horizontal scroll, a wrap-count difference or a hard
// disagreement.
import { createRequire } from 'module';
import fs from 'fs';

const require = createRequire('/Users/ronnyfernandez/Github Repos/ForumMagnum-layout/package.json');
const playwright = require('playwright');

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => {
  if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true]);
  return acc;
}, []));
const BASE = process.env.BASE_URL || 'http://localhost:3001';
const ROOT = '/experiment-widget-blocks-7qunirv1o86fgfg7k1e9bru6e';
const demo = args.demo || 'blocks';
const route = demo === 'blocks' ? `${ROOT}/blocks` : ROOT;
const storageKey = `lwWidgetBlocksEdits:${demo}`;
const from = Number(args.from ?? 320), to = Number(args.to ?? 2560), step = Number(args.step ?? 8);
const widths = []; for (let w = from; w <= to; w += step) widths.push(w);
if (widths[widths.length - 1] !== to) widths.push(to);
const css = args.css ? fs.readFileSync(args.css, 'utf8') : '';
const specimen = args.specimen ? fs.readFileSync(args.specimen, 'utf8') : null;
const engine = args.engine || 'chromium';

const MEASURE = (view) => {
  const isEditor = view === 'editor';
  const editorRoot = document.querySelector('[data-lexical-editor]');
  const body = document.querySelector('[data-testid=widget-drag-post-body]');
  const root = isEditor ? editorRoot
    : (body.querySelector('.iframe-widget')?.parentElement ?? body.querySelector('p')?.parentElement);
  const rootRect = root.getBoundingClientRect();
  const cs = getComputedStyle(root);
  const colLeft = rootRect.left + parseFloat(cs.paddingLeft);
  const colRight = rootRect.right - parseFloat(cs.paddingRight);
  // Floated widgets that show (one in a closed collapsible section has no box).
  const widgetEls = [...root.querySelectorAll(isEditor ? '.iframe-widget-code[data-lw-wraps]' : 'iframe.lwFloatedWidget')]
    .filter(w => w.getBoundingClientRect().width > 0 && !w.closest('details:not([open])'));
  const widgets = widgetEls.map(w => w.getBoundingClientRect());
  const inter = (a, b) => a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1;
  // A block holding a widget (a quote with a widget inside) contains it, which is no overlap.
  const hits = (el, r) => widgetEls.some((w, i) => !el.contains(w) && inter(r, widgets[i]));
  const R = r => ({ x: Math.round(r.left - colLeft), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height) });
  const overlaps = [];
  // (Nothing inside a closed collapsible section shows.)
  // (Nor MathJax's copy of an equation for screen readers: it is clipped to nothing.)
  const skip = el => el.closest('.iframe-widget-code, .iframe-widget, iframe[data-lexical-iframe-widget], .sentinel-paragraph, details:not([open]) > :not(summary), mjx-assistive-mml');
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.textContent.trim()) continue;
    const el = n.parentElement;
    if (skip(el)) continue;
    const range = document.createRange(); range.selectNodeContents(n);
    for (const r of range.getClientRects()) {
      if (r.width < 1 || r.height < 1) continue;
      if (hits(el, r)) overlaps.push({ kind: 'text', tag: el.tagName, text: n.textContent.trim().slice(0, 40), rect: R(r) });
    }
  }
  for (const el of root.querySelectorAll('*')) {
    if (skip(el)) continue;
    const s = getComputedStyle(el);
    if (s.visibility === 'hidden' || s.display === 'none') continue;
    const visible = (s.backgroundColor !== 'rgba(0, 0, 0, 0)' && s.backgroundColor !== 'transparent')
      || ['Top', 'Right', 'Bottom', 'Left'].some(side => parseFloat(s[`border${side}Width`]) > 0 && s[`border${side}Style`] !== 'none' && !/rgba\(\d+, \d+, \d+, 0\)/.test(s[`border${side}Color`]))
      || /^(IMG|IFRAME|SVG|VIDEO|CANVAS|HR|MJX-CONTAINER)$/i.test(el.tagName);
    if (!visible) continue;
    // An equation's container is as wide as its line; what shows is the equation itself.
    const r = (el.tagName === 'MJX-CONTAINER' ? el.querySelector('mjx-math') ?? el : el).getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    if (hits(el, r)) overlaps.push({ kind: 'box', tag: el.tagName, cls: el.className?.toString?.().slice(0, 50), text: (el.textContent || '').trim().slice(0, 40), rect: R(r) });
  }
  for (const li of root.querySelectorAll('li')) {
    if (skip(li)) continue;
    const ls = getComputedStyle(li);
    if (ls.listStylePosition !== 'outside' || ls.listStyleType === 'none' || ls.display !== 'list-item') continue;
    const tw = document.createTreeWalker(li, NodeFilter.SHOW_TEXT);
    let t = tw.nextNode(); while (t && !t.textContent.trim()) t = tw.nextNode();
    if (!t) continue;
    const range = document.createRange(); range.setStart(t, 0); range.setEnd(t, Math.min(1, t.length));
    const first = range.getClientRects()[0];
    if (!first) continue;
    const marker = { left: first.left - 22, right: first.left - 4, top: first.top, bottom: first.bottom };
    if (hits(li, marker)) overlaps.push({ kind: 'marker', tag: 'LI', text: li.textContent.trim().slice(0, 40), rect: R(marker) });
  }
  // Top-level blocks, matched across views by their text.
  const blocks = [];
  const seen = {};
  for (const el of root.children) {
    if (el.matches('.sentinel-paragraph, .iframe-widget-code, .iframe-widget, style, script')) continue;
    const r = el.getBoundingClientRect();
    if (r.height < 1) continue;
    // Its text, without what only one view has (a widget's source in the editor, the AI content label).
    let text = '';
    const words = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = words.nextNode(); n && text.length < 80; n = words.nextNode()) {
      if (!n.parentElement.closest('.iframe-widget-code, .llm-content-block-header, style, script')) text += n.textContent;
    }
    text = text.replace(/\s+/g, ' ').trim().slice(0, 50);
    const base = text || `<${el.tagName.toLowerCase()}>`;
    seen[base] = (seen[base] ?? 0) + 1;
    let firstLineX = null;
    // A display equation draws its glyphs from CSS, so it has no text to measure: take where it starts.
    // (Not inline math in a paragraph: its first line starts with the paragraph's text. The post wraps an
    // equation wider than the column at load in a scroll box, which stays once the window is wider.)
    const equation = el.matches('.math-tex, .horiz-scroll-block:has(div.math-tex)') ? el.querySelector('mjx-math') : null;
    const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let t = tw.nextNode(); while (t && (!t.textContent.trim() || t.parentElement.closest('.iframe-widget-code, .llm-content-block-header'))) t = tw.nextNode();
    if (equation) {
      firstLineX = Math.round(equation.getBoundingClientRect().left - colLeft);
    } else if (t) {
      const range = document.createRange(); const i = t.textContent.search(/\S/);
      range.setStart(t, i); range.setEnd(t, i + 1);
      const fr = range.getClientRects()[0];
      if (fr) firstLineX = Math.round(fr.left - colLeft);
    }
    const nearWidgetBottom = widgets.some(w => Math.abs(r.top - w.bottom) < 40 || Math.abs(r.top - w.top) < 4);
    blocks.push({ key: `${base}#${seen[base]}`, tag: el.tagName, x: Math.round(r.left - colLeft), w: Math.round(r.width), firstLineX, nearWidgetBottom });
  }
  return {
    column: Math.round(colRight - colLeft),
    hscroll: document.documentElement.scrollWidth > innerWidth + 1,
    // (Not counting widgets in collapsible sections: the editor shows those open, the post closed.)
    wraps: widgetEls.filter(w => !w.closest('.detailsBlock')).length,
    overlaps,
    blocks,
  };
};

const browser = await playwright[engine].launch({
  // (Like the other checks: the installed Chrome, or PW_CHROMIUM where there is none.)
  ...(engine === 'chromium' ? (process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : { channel: 'chrome' }) : {}),
  headless: true,
  ...(engine === 'chromium' ? { args: ['--mute-audio'] } : {}),
});
const report = { demo, engine, from, to, step, widths: [] };
let failures = 0;
try {
  const base = specimen ? (await (await fetch(`${BASE}${route}/default-post`)).json()).base : null;
  const open = async (view) => {
    const ctx = await browser.newContext({ viewport: { width: widths[0], height: 1000 } });
    if (specimen) {
      // The editor opens on stored edits only with ?specimen (it otherwise always opens on the original post).
      await ctx.addInitScript(([key, value]) => { try { sessionStorage.setItem(key, value); } catch { /* none */ } },
        [storageKey, JSON.stringify({ base, html: specimen })]);
    }
    const page = await ctx.newPage();
    await page.goto(`${BASE}${route}${view === 'editor' ? `/editor${specimen ? '?specimen' : ''}` : ''}`, { waitUntil: 'domcontentloaded', timeout: 240000 });
    await page.waitForSelector(view === 'editor' ? '[data-lexical-editor]' : '[data-testid=widget-drag-post-body] p', { timeout: 240000 });
    await page.waitForTimeout(view === 'editor' ? 7000 : 5000);
    if (css) await page.addStyleTag({ content: css });
    return { ctx, page };
  };
  const ed = await open('editor');
  const po = await open('post');
  const settle = async (page, view) => {
    let prev = null;
    for (let i = 0; i < 6; i++) {
      await page.waitForTimeout(i === 0 ? 350 : 250);
      const m = await page.evaluate(MEASURE, view);
      const sig = JSON.stringify([m.wraps, m.blocks.map(b => [b.x, b.w, b.firstLineX])]);
      if (sig === prev) return m;
      prev = sig;
      if (i === 5) return m;
    }
  };
  for (const w of widths) {
    await Promise.all([ed.page.setViewportSize({ width: w, height: 1000 }), po.page.setViewportSize({ width: w, height: 1000 })]);
    const [e, p] = await Promise.all([settle(ed.page, 'editor'), settle(po.page, 'post')]);
    const pByKey = Object.fromEntries(p.blocks.map(b => [b.key, b]));
    const hard = [], drift = [];
    for (const eb of e.blocks) {
      const pb = pByKey[eb.key];
      if (!pb) continue;
      const diffs = [];
      if (Math.abs(eb.x - pb.x) > 2) diffs.push(`x ${eb.x}/${pb.x}`);
      if (Math.abs(eb.w - pb.w) > 2) diffs.push(`w ${eb.w}/${pb.w}`);
      // (6px: a code block's line-number gutter differs a little between the two.)
      if (eb.firstLineX !== null && pb.firstLineX !== null && Math.abs(eb.firstLineX - pb.firstLineX) > 6) diffs.push(`line ${eb.firstLineX}/${pb.firstLineX}`);
      if (!diffs.length) continue;
      const item = `${eb.key.slice(0, 40)}: ${diffs.join(', ')}`;
      (eb.nearWidgetBottom || pb.nearWidgetBottom ? drift : hard).push(item);
    }
    const row = {
      width: w, column: [e.column, p.column], wraps: [e.wraps, p.wraps],
      hscroll: [e.hscroll, p.hscroll],
      overlaps: { editor: e.overlaps, post: p.overlaps },
      hard, drift,
      unmatched: e.blocks.filter(b => !pByKey[b.key]).map(b => b.key.slice(0, 40)),
    };
    const bad = e.overlaps.length || p.overlaps.length || e.hscroll || p.hscroll || e.wraps !== p.wraps || hard.length;
    if (bad) failures++;
    report.widths.push(row);
    if (bad || drift.length) {
      console.log(`${w}: col ${e.column}/${p.column} wraps ${e.wraps}/${p.wraps}`
        + `${e.hscroll || p.hscroll ? ` HSCROLL ${e.hscroll}/${p.hscroll}` : ''}`
        + `${e.overlaps.length ? ` editorOverlaps ${e.overlaps.map(o => `${o.kind}:${o.tag}:${o.text.slice(0, 20)}`).join(' | ')}` : ''}`
        + `${p.overlaps.length ? ` postOverlaps ${p.overlaps.map(o => `${o.kind}:${o.tag}:${o.text.slice(0, 20)}`).join(' | ')}` : ''}`
        + `${hard.length ? ` DIFF ${hard.join(' ; ')}` : ''}`
        + `${drift.length ? ` drift ${drift.length}` : ''}`);
    }
  }
  await ed.ctx.close(); await po.ctx.close();
} finally {
  await browser.close();
}
if (args.out) fs.writeFileSync(args.out, JSON.stringify(report, null, 1));
const unmatched = new Set(report.widths.flatMap(r => r.unmatched));
console.log(`\n${engine} ${demo}: ${widths.length} widths, ${failures} with problems, ${report.widths.filter(r => r.drift.length).length} with drift only.`
  + (unmatched.size ? ` Unmatched editor blocks: ${[...unmatched].slice(0, 8).join(' | ')}` : ''));
process.exit(failures ? 1 : 0);
