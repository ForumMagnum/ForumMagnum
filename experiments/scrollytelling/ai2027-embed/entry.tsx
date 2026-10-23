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

function Embed() {
  const [frame, setFrame] = useState(0);
  const [scale, setScale] = useState(1);
  const hudRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type !== 'lw-scrolly') return;
      const f = frameFor(e.data);
      if (f !== null) setFrame(f);
      else if (typeof e.data.index === 'number' && e.data.index < 0) setFrame(0);
    };
    window.addEventListener('message', onMsg);
    // Fit the HUD's natural size (measured, since some rows overflow 448px) to the frame.
    const fit = () => {
      const el = hudRef.current; if (!el) return;
      const w = 448, h = Math.max(el.scrollHeight, 400);
      setScale(Math.min(1.6, (window.innerWidth - 8) / w, (window.innerHeight - 8) / h));
    };
    const ro = new ResizeObserver(fit); if (hudRef.current) ro.observe(hudRef.current);
    window.addEventListener('resize', fit); fit();
    return () => { window.removeEventListener('message', onMsg); window.removeEventListener('resize', fit); ro.disconnect(); };
  }, []);
  // ArticleContent advances its date marker by one day. Preserve that behavior.
  const currentDate = new Date(new Date(frames[frame][0]).getTime() + 86400000);
  return <div className="race lw-embed-stage">
    <div className="lw-embed-hud" ref={hudRef} style={{ transform: `scale(${scale})` }}>
      <HUD currentDate={currentDate} chartData={frames} defaultChartData={frames} standalone />
    </div>
  </div>;
}

createRoot(document.getElementById('root')!).render(<Embed />);
