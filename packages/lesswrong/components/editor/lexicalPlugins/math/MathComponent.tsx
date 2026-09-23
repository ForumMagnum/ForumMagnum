"use client";
import { useEffect, useRef } from "react";
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { renderEquation } from "./loadMathJax";

const styles = defineStyles('MathComponent', (theme: ThemeType) => ({
  preview: {
    userSelect: 'none',
    minWidth: '1em',
    minHeight: '1em',
    '& mjx-merror': {
      color: theme.palette.error.light,
      backgroundColor: 'transparent',
    },
  },
  inline: {
    display: 'inline-block',
  },
  display: {
    display: 'block',
    textAlign: 'center',
    margin: '1em 0',
  },
  placeholder: {
    color: theme.palette.text.dim,
  },
}));

export function MathComponent({ equation, inline }: {
  equation: string;
  inline: boolean;
  nodeKey: string;
}): React.ReactElement {
  const classes = useStyles(styles);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (!equation.trim()) {
      container.textContent = inline ? '' : 'Equation';
      return;
    }

    // Keep the previous preview visible while typesetting. A slow render must
    // not overwrite a newer equation, or an equation restored by Escape.
    let active = true;
    const rendered = document.createElement('span');
    void renderEquation(equation, rendered, !inline).then(() => {
      if (active) container.replaceChildren(...rendered.childNodes);
    });
    return () => { active = false; };
  }, [equation, inline]);

  return (
    <span
      ref={containerRef}
      className={classNames('math-preview', inline ? 'math-inline' : 'math-display', classes.preview, inline ? classes.inline : classes.display, {
        [classes.placeholder]: !inline && !equation.trim(),
      })}
    />
  );
}
