// Measures the text column width of the Exp 3 editor and Post tab at window widths 320..900.
import { createRequire } from 'module';
const require = createRequire('/Users/ronnyfernandez/Github Repos/ForumMagnum-layout/package.json');
const { chromium } = require('playwright');
const BASE = process.env.BASE_URL || 'http://localhost:3000';
const R = '/experiment-widget-blocks-7qunirv1o86fgfg7k1e9bru6e';
const widths = []; for (let w = Number(process.env.FROM || 320); w <= Number(process.env.TO || 900); w += Number(process.env.STEP || 8)) widths.push(w);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM, headless: true, args: ['--mute-audio'] });
try {
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 900 } });
  const ed = await ctx.newPage(); await ed.goto(BASE + R + '/editor', { waitUntil: 'domcontentloaded', timeout: 240000 });
  await ed.waitForSelector('[data-lexical-editor]', { timeout: 240000 });
  const po = await ctx.newPage(); await po.goto(BASE + R, { waitUntil: 'domcontentloaded', timeout: 240000 });
  await po.waitForSelector('[data-testid=widget-drag-post-body] p', { timeout: 240000 });
  const rows = [];
  for (const w of widths) {
    await ed.setViewportSize({ width: w, height: 900 }); await po.setViewportSize({ width: w, height: 900 });
    await ed.waitForTimeout(150); await po.waitForTimeout(150);
    const e = await ed.evaluate(() => { const r = document.querySelector('[data-lexical-editor]'); const cs = getComputedStyle(r); const b = r.getBoundingClientRect(); return { col: Math.round(b.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)), left: Math.round(b.left + parseFloat(cs.paddingLeft)) }; });
    const p = await po.evaluate(() => { const p = document.querySelector('[data-testid=widget-drag-post-body] p'); const host = p.parentElement; const b = host.getBoundingClientRect(); return { col: Math.round(b.width), left: Math.round(b.left), sw: document.documentElement.scrollWidth }; });
    rows.push(`${w}\teditor ${e.col} @${e.left}\treader ${p.col} @${p.left}\t${e.col === p.col ? '' : 'DIFF ' + (e.col - p.col)}${p.sw > w ? ' hscroll' : ''}`);
  }
  console.log(rows.join('\n'));
} finally { await browser.close(); }
