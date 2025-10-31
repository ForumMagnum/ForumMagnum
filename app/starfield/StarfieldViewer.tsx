"use client";
import React, { useEffect, useMemo, useState } from 'react';
import throttle from 'lodash/throttle';
import { generateStarfieldDataUrl } from "@/components/seasonal/solsticeSeason/SolsticeGlobe3D";

const StarfieldViewer = () => {
  const [size, setSize] = useState<{ width: number; height: number }>({ width: 800, height: 600 });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const update = () => setSize({ width: window.innerWidth || 800, height: window.innerHeight || 600 });
    const onResize = throttle(update, 100);
    update();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize as unknown as EventListener);
      onResize.cancel();
    };
  }, []);

  const src = useMemo(() => generateStarfieldDataUrl(Math.max(1, Math.floor(size.width)), Math.max(1, Math.floor(size.height))), [size.width, size.height]);

  return (
    <img src={src} alt="" style={{ width: '100vw', height: '100vh', display: 'block', objectFit: 'cover', imageRendering: 'pixelated' }} />
  );
};

export default StarfieldViewer;

