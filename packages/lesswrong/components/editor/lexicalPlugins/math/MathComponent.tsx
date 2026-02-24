"use client";
import { useEffect, useRef } from "react";
import { renderEquation } from "./loadMathJax";

export function MathComponent({ equation, inline }: {
  equation: string;
  inline: boolean;
  nodeKey: string;
}): React.ReactElement {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Show loading state
    containerRef.current.textContent = '...';
    
    // Render the equation (this will load MathJax if needed)
    void renderEquation(equation, containerRef.current, !inline);
  }, [equation, inline]);

  const style: React.CSSProperties = inline
    ? { display: 'inline-block', userSelect: 'none' }
    : { display: 'block', textAlign: 'center', margin: '1em 0', userSelect: 'none' };

  return (
    <span
      ref={containerRef}
      className={`math-preview ${inline ? 'math-inline' : 'math-display'}`}
      style={style}
    >
      {/* Initial content shows loading indicator while MathJax loads */}
      ...
    </span>
  );
}
