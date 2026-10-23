import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import HUD from '@/app/HUD';
import { panelData } from '@/panelData';
import sections from './sections.json';

// The race ending, as in the graphic player.
const frames = panelData.filter(row => row[2] !== 'slowdown');
const frameIndexByDate = new Map(frames.map((row, i) => [row[0], i]));

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// Map an LW scroll message (active heading + progress through that section) to a panel frame.
function frameFor(msg: { heading?: string, progress?: number }): number | null {
  if (!msg.heading) return null;
  const h = norm(msg.heading);
  const section = (sections as { heading: string, dates: string[] }[]).find(s => norm(s.heading) === h || h.startsWith(norm(s.heading).slice(0, 14)));
  if (!section || !section.dates.length) return null;
  const k = Math.min(section.dates.length - 1, Math.floor((msg.progress ?? 0) * section.dates.length));
  return frameIndexByDate.get(section.dates[k]) ?? null;
}

// Scale against the tallest stage (the HUD grows as agent copies multiply), so the zoom stays steady.
const TALLEST_STAGE = 720;
const HUD_WIDTH = 448;

function Embed() {
  const [frame, setFrame] = useState(0);
  const [width, setWidth] = useState(window.innerWidth);
  const [maxHeight, setMaxHeight] = useState(Infinity);
  const [naturalHeight, setNaturalHeight] = useState(TALLEST_STAGE);
  const hudRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      // LessWrong tells the widget its page background (so the panel blends into the page)
      // and how much height it may use.
      if (e.data?.type === 'lw-scrolly-theme') {
        if (typeof e.data.background === 'string') document.documentElement.style.setProperty('--vivid-background', e.data.background);
        if (typeof e.data.maxHeight === 'number') setMaxHeight(e.data.maxHeight);
        return;
      }
      if (e.data?.type !== 'lw-scrolly') return;
      const f = frameFor(e.data);
      if (f !== null) setFrame(f);
      else if (typeof e.data.index === 'number' && e.data.index < 0) setFrame(0);
    };
    window.addEventListener('message', onMsg);
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    // The HUD's unscaled height; the page sizes the panel to what we actually draw.
    const ro = new ResizeObserver(() => { if (hudRef.current) setNaturalHeight(hudRef.current.offsetHeight); });
    if (hudRef.current) ro.observe(hudRef.current);
    return () => { window.removeEventListener('message', onMsg); window.removeEventListener('resize', onResize); ro.disconnect(); };
  }, []);
  const scale = Math.min(1.6, (width - 8) / HUD_WIDTH, (maxHeight - 8) / TALLEST_STAGE);
  // ArticleContent advances its date marker by one day. Preserve that behavior.
  const currentDate = new Date(new Date(frames[frame][0]).getTime() + 86400000);
  // The stage is exactly as tall as the drawing, so the iframe's reported height is the graphic's.
  return <div className="race lw-embed-stage" style={{ height: Math.ceil(naturalHeight * scale) }}>
    <div className="lw-embed-hud" ref={hudRef} style={{ transform: `translateX(-50%) scale(${scale})` }}>
      <HUD currentDate={currentDate} chartData={frames} defaultChartData={frames} standalone />
    </div>
  </div>;
}

createRoot(document.getElementById('root')!).render(<Embed />);
