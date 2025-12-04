import React, { useLayoutEffect, useRef, useState } from 'react';

export const PushIntoViewport = ({children}: {
  children: React.ReactNode
}) => {
  const wrapperSpanRef = useRef<HTMLSpanElement|null>(null);
  const [offset, setOffset] = useState<{left: number, top: number}>({left: 0, top: 0});
  
  useLayoutEffect(() => {
    const wrapperSpan = wrapperSpanRef.current;
    if (!wrapperSpan) return;
    const rect = wrapperSpan.getBoundingClientRect();
    const newOffset = offsetToPushIntoView(rect);
    setOffset((oldOffset) => (newOffset.left !== oldOffset.left || newOffset.top !== oldOffset.top)
      ? newOffset
      : oldOffset
    );
  }, []);

  return <span ref={wrapperSpanRef} style={{
    position: "relative",
    left: offset.left,
    top: offset.top,
  }}>
    {children}
  </span>
}

const offsetToPushIntoView = (originalRect: DOMRect) => {
  const width = window.innerWidth;
  if (originalRect.left < 0) {
    return {left: -originalRect.left, top: 0};
  } else if (originalRect.right > width) {
    const amountOffscreen = originalRect.right - width;
    const newLeft = Math.max(0, originalRect.left - amountOffscreen);
    const offsetLeft = newLeft - originalRect.left;
    return {left: offsetLeft, top: 0};
  } else {
    return {left: 0, top: 0};
  }
}
