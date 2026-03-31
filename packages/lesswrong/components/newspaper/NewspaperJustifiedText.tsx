import React, { useRef, useState, useEffect } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { prepareForJustification, layoutJustified, type JustifiedLine } from './knuthPlassJustify';

const styles = defineStyles('NewspaperJustifiedText', () => ({
  justifiedLine: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  paragraph: {
    marginBottom: '0.5em',
    '&:last-child': {
      marginBottom: 0,
    },
  },
}), { allowNonThemeColors: true });

function htmlToParagraphs(html: string): string[] {
  const div = document.createElement('div');
  div.innerHTML = html;
  const paragraphs: string[] = [];
  for (const node of Array.from(div.childNodes)) {
    const text = node.textContent?.trim();
    if (text) paragraphs.push(text);
  }
  if (paragraphs.length === 0) {
    const fallback = div.textContent?.trim();
    if (fallback) return [fallback];
  }
  return paragraphs;
}

function truncateToMaxLines(paragraphs: JustifiedLine[][], maxLines: number): JustifiedLine[][] {
  let totalLines = 0;
  const result: JustifiedLine[][] = [];
  for (const para of paragraphs) {
    const remaining = maxLines - totalLines;
    if (remaining <= 0) break;
    if (para.length <= remaining) {
      result.push(para);
      totalLines += para.length;
    } else {
      result.push(para.slice(0, remaining));
      break;
    }
  }
  return result;
}

const NewspaperJustifiedText = ({html, maxLines}: {html: string, maxLines?: number}) => {
  const classes = useStyles(styles);
  const containerRef = useRef<HTMLDivElement>(null);
  const [justified, setJustified] = useState<JustifiedLine[][] | null>(null);
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !html) return;
    let cancelled = false;
    let observer: ResizeObserver | null = null;
    document.fonts.ready.then(() => {
      if (cancelled) return;
      const computedStyle = getComputedStyle(container);
      const font = `${computedStyle.fontSize} ${computedStyle.fontFamily}`;
      const textParagraphs = htmlToParagraphs(html);
      if (textParagraphs.length === 0) return;
      const data = prepareForJustification(textParagraphs, font);
      let prevWidth = 0;
      function layout() {
        const rect = container!.getBoundingClientRect();
        const cs = getComputedStyle(container!);
        const width = rect.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        if (width <= 0 || width === prevWidth) return;
        prevWidth = width;
        let result = layoutJustified(data, width);
        if (maxLines) result = truncateToMaxLines(result, maxLines);
        setJustified(result);
      }
      layout();
      observer = new ResizeObserver(layout);
      observer.observe(container);
    });
    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [html, maxLines]);
  return <div ref={containerRef}>
    {justified?.map((para, pIdx) => (
      <div key={pIdx} className={classes.paragraph}>
        {para.map((line, lIdx) => (
          line.isJustified
            ? <div key={lIdx} className={classes.justifiedLine}>
                {line.words.map((word, wIdx) => <span key={wIdx}>{word}</span>)}
              </div>
            : <div key={lIdx}>{line.words.join(' ')}</div>
        ))}
      </div>
    ))}
  </div>;
};

export default NewspaperJustifiedText;
