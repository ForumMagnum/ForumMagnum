import { useEffect, useState } from 'react';

interface VisualViewportRect {
  height: number;
  offsetTop: number;
}

function getVisualViewportRect(viewport: VisualViewport): VisualViewportRect {
  return { height: viewport.height, offsetTop: viewport.offsetTop };
}

export const useVisualViewportRect = (): VisualViewportRect | null => {
  const [rect, setRect] = useState<VisualViewportRect | null>(null);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) {
      return;
    }
    const handleChange = () => setRect(getVisualViewportRect(viewport));
    handleChange();
    viewport.addEventListener('resize', handleChange);
    viewport.addEventListener('scroll', handleChange);
    return () => {
      viewport.removeEventListener('resize', handleChange);
      viewport.removeEventListener('scroll', handleChange);
    };
  }, []);

  return rect;
};
