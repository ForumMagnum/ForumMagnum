// Experiment 3 prototype harness. Renders a specimen (post HTML) in the REAL Experiment 3 editor and Post
// tab, optionally with candidate CSS injected, at several window widths, and writes per-section
// screenshots plus overlap metrics.
//
// Usage (always through the slot lock):
//   ~/lw-exp3-proto/with-slot.sh node ~/lw-exp3-proto/proto-render.mjs --specimen spec.html --out DIR \
//     [--css candidate.css] [--widths 1280,800,700,640,600,560,420,360] [--views editor,post] [--full]
//
// Specimen format: post HTML as LessWrong saves it. Split it into sections with marker paragraphs
//   <p>PROTO:some-id</p>
// Each section is screenshotted from its marker to the next marker (or the end). Widgets are
//   <iframe data-lexical-iframe-widget="true" sandbox="allow-scripts" srcdoc="...escaped html..."></iframe>
// with a <meta name="lw-layout" content="position=left width=33%"> first in the srcdoc. Use
// ~/lw-exp3-proto/widget.mjs to make one: node -e 'import("/Users/ronnyfernandez/lw-exp3-proto/widget.mjs").then(m=>console.log(m.widget("left","33%")))'
//
// Candidate CSS applies to both views. Editor DOM: a floated widget is a spacer
// `.iframe-widget-code[data-lw-wraps]` (a sibling of the blocks after it, under [data-lexical-editor]);
// reader DOM: `div.iframe-widget` containing `iframe.lwFloatedWidget` (match with
// `.iframe-widget:has(> .lwFloatedWidget) ~ X`), inside #postContent.
//
// Output: DIR/<view>-<width>-<section>.png and DIR/metrics.json:
//   {view, width, column, section, widgets:[rect], overlaps:[{kind:'text'|'box', tag, cls, text, rect}], hscroll}
// "overlaps" lists text lines or bordered/backgrounded boxes that intersect a floated widget's box (they
// should not); hscroll is true if the page scrolls sideways.
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

const require = createRequire('/Users/ronnyfernandez/Github Repos/ForumMagnum-layout/package.json');
const { chromium } = require('playwright');

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => {
  if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true]);
  return acc;
}, []));
const BASE = process.env.BASE_URL || 'http://localhost:3000';
const ROUTE = '/experiment-widget-blocks-7qunirv1o86fgfg7k1e9bru6e/blocks';
const STORAGE_KEY = 'lwWidgetBlocksEdits:blocks';
const specimen = fs.readFileSync(args.specimen, 'utf8');
const css = args.css ? fs.readFileSync(args.css, 'utf8') : '';
const widths = String(args.widths || '1280,800,700,640,600,560,420,360').split(',').map(Number);
const views = String(args.views || 'editor,post').split(',');
const OUT = args.out; fs.mkdirSync(OUT, { recursive: true });

const base = (await (await fetch(`${BASE}${ROUTE}/default-post`)).json()).base;

const METRICS_JS = (view) => {
  // (The post page has a comment box that is a Lexical editor too, so the view decides.)
  const isEditor = view === 'editor';
  const root = isEditor ? document.querySelector('[data-lexical-editor]') : document.querySelector('[data-testid=widget-drag-post-body] #postBody, [data-testid=widget-drag-post-body]');
  const widgetRects = isEditor
    ? [...document.querySelectorAll('.iframe-widget-code[data-lw-wraps]')].map(s => s.getBoundingClientRect())
    : [...root.querySelectorAll('iframe.lwFloatedWidget')].map(f => f.getBoundingClientRect());
  const rootRect = root.getBoundingClientRect();
  const cs = getComputedStyle(root);
  const column = Math.round(rootRect.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight));
  const markers = [...root.querySelectorAll('p')].filter(p => /^PROTO:/.test(p.textContent.trim()));
  const sections = markers.map((m, i) => {
    const top = m.getBoundingClientRect().top + scrollY;
    const next = markers[i + 1];
    const bottom = next ? next.getBoundingClientRect().top + scrollY : rootRect.bottom + scrollY;
    return { id: m.textContent.trim().slice(6), top, bottom };
  });
  const inter = (a, b) => a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1;
  const R = r => ({ x: Math.round(r.left), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height) });
  const overlaps = [];
  // Text lines
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.textContent.trim()) continue;
    const el = n.parentElement;
    if (el.closest('.iframe-widget-code, .iframe-widget, iframe')) continue;
    const range = document.createRange(); range.selectNodeContents(n);
    for (const r of range.getClientRects()) {
      if (r.width < 1 || r.height < 1) continue;
      if (widgetRects.some(w => inter(r, w))) overlaps.push({ kind: 'text', tag: el.tagName, cls: el.className?.toString?.().slice(0, 60), text: n.textContent.trim().slice(0, 40), rect: R(r) });
    }
  }
  // Visible boxes (background, border, list markers, images, iframes, svg, math)
  for (const el of root.querySelectorAll('*')) {
    if (el.closest('.iframe-widget-code, .iframe-widget')) continue;
    const s = getComputedStyle(el);
    const visible = (s.backgroundColor !== 'rgba(0, 0, 0, 0)' && s.backgroundColor !== 'transparent')
      || ['Top', 'Right', 'Bottom', 'Left'].some(side => parseFloat(s[`border${side}Width`]) > 0 && s[`border${side}Style`] !== 'none')
      || /^(IMG|IFRAME|SVG|VIDEO|CANVAS|HR|MJX-CONTAINER)$/i.test(el.tagName);
    if (!visible) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    if (widgetRects.some(w => inter(r, w))) overlaps.push({ kind: 'box', tag: el.tagName, cls: el.className?.toString?.().slice(0, 60), text: (el.textContent || '').trim().slice(0, 40), rect: R(r) });
  }
  // List markers: an outside marker sits just left of where the item's first line starts.
  for (const li of root.querySelectorAll('li')) {
    const ls = getComputedStyle(li);
    if (ls.listStylePosition !== 'outside' || ls.listStyleType === 'none') continue;
    const tw = document.createTreeWalker(li, NodeFilter.SHOW_TEXT);
    let t = tw.nextNode(); while (t && !t.textContent.trim()) t = tw.nextNode();
    if (!t) continue;
    const range = document.createRange(); range.setStart(t, 0); range.setEnd(t, Math.min(1, t.length));
    const first = range.getClientRects()[0];
    if (!first) continue;
    const marker = { left: first.left - 22, right: first.left - 4, top: first.top, bottom: first.bottom };
    if (widgetRects.some(w => inter(marker, w))) overlaps.push({ kind: 'marker', tag: 'LI', cls: '', text: li.textContent.trim().slice(0, 40), rect: R(marker) });
  }
  const withSection = o => ({ ...o, section: sections.find(s => o.rect.y >= s.top - 1 && o.rect.y < s.bottom)?.id ?? '?' });
  return {
    column,
    hscroll: document.documentElement.scrollWidth > innerWidth + 1,
    widgets: widgetRects.map(R),
    sections: sections.map(s => ({ id: s.id, top: Math.round(s.top), bottom: Math.round(s.bottom) })),
    overlaps: overlaps.map(withSection),
  };
};

const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM, headless: true, args: ['--mute-audio'] });
const all = [];
try {
  for (const view of views) {
    const ctx = await browser.newContext({ viewport: { width: widths[0], height: 1000 } });
    await ctx.addInitScript(([key, value]) => { try { localStorage.setItem(key, value); } catch { /* none */ } },
      [STORAGE_KEY, JSON.stringify({ base, html: specimen })]);
    const page = await ctx.newPage();
    const url = view === 'editor' ? `${BASE}${ROUTE}/editor` : `${BASE}${ROUTE}`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 240000 });
    await page.waitForSelector(view === 'editor' ? '[data-lexical-editor]' : '[data-testid=widget-drag-post-body]', { timeout: 240000 });
    await page.waitForTimeout(view === 'editor' ? 7000 : 4000);
    if (css) await page.addStyleTag({ content: css });
    for (const w of widths) {
      await page.setViewportSize({ width: w, height: 1000 });
      await page.waitForTimeout(1200);
      const m = await page.evaluate(METRICS_JS, view);
      all.push({ view, width: w, ...m });
      for (const s of m.sections) {
        if (args.sections && !String(args.sections).split(',').includes(s.id)) continue;
        const h = Math.min(Math.max(s.bottom - s.top, 40), 2400);
        await page.screenshot({ path: path.join(OUT, `${view}-${w}-${s.id}.png`), fullPage: true,
          clip: { x: 0, y: Math.max(0, s.top - 8), width: w, height: h + 8 } });
      }
      if (args.full) await page.screenshot({ path: path.join(OUT, `${view}-${w}-full.png`), fullPage: true });
    }
    await ctx.close();
  }
} finally {
  await browser.close();
}
fs.writeFileSync(path.join(OUT, 'metrics.json'), JSON.stringify(all, null, 1));
for (const m of all) {
  const bySection = {};
  for (const o of m.overlaps) (bySection[o.section] ??= []).push(`${o.kind}:${o.tag}`);
  console.log(`${m.view} ${m.width} col=${m.column}${m.hscroll ? ' HSCROLL' : ''} widgets=${m.widgets.length} overlaps=${m.overlaps.length} ${JSON.stringify(bySection)}`);
}
