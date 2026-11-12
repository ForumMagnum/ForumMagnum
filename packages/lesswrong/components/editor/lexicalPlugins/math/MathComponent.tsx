"use client";
import { useEffect, useRef } from "react";
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { HorizScrollBlock } from '@/components/contents/HorizScrollBlock';
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
  },
  // The vertical margin goes outside the scrolling area, so that it collapses
  // with the margins of adjacent blocks.
  displayScrollBlock: {
    margin: '1em 0',
  },
  // Undo HorizScrollBlock's expanded touch target, which assumes it's wrapping
  // a block whose margins it can absorb.
  displayScrollContents: {
    marginTop: '0 !important',
    marginBottom: '0 !important',
    paddingTop: '0 !important',
    paddingBottom: '0 !important',
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

  const preview = (
    <span
      ref={containerRef}
      className={classNames('math-preview', inline ? 'math-inline' : 'math-display', classes.preview, inline ? classes.inline : classes.display, {
        [classes.placeholder]: !inline && !equation.trim(),
      })}
    />
  );

  if (inline) {
    return preview;
  }

  // Display equations that are too wide get horizontal scrolling. This wrapper
  // is present even when the equation fits, because the preview's contents are
  // written imperatively and would be lost if the span were remounted.
  return (
    <HorizScrollBlock className={classes.displayScrollBlock} contentsClassName={classes.displayScrollContents}>
      {preview}
    </HorizScrollBlock>
  );
}
