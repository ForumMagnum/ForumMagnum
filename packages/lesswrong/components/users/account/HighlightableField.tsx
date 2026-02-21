import React, { useState, useRef, useEffect } from 'react';
import classNames from 'classnames';
import { useLocation } from '@/lib/routeUtil';
import { HIGHLIGHT_DURATION } from '@/components/comments/CommentFrame';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('HighlightableField', (theme: ThemeType) => ({
  '@keyframes higlight-animation': {
    from: {
      backgroundColor: theme.palette.panelBackground.commentHighlightAnimation,
      borderRadius: 5,
    },
    to: {
      backgroundColor: "none",
      borderRadius: 5,
    }
  },
  highlightAnimation: {
    animation: `higlight-animation ${HIGHLIGHT_DURATION}s ease-in-out 0s;`
  },
}));

export const HighlightableField = ({ name, children }: { name: string, children: React.ReactNode }) => {
  const classes = useStyles(styles);
  const [highlight, setHighlight] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { query } = useLocation();

  useEffect(() => {
    if (name && name === query?.highlightField) {
      scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      setHighlight(true);
      setTimeout(() => {
        setHighlight(false);
      }, HIGHLIGHT_DURATION * 1000);
    }
  }, [name, query?.highlightField]);

  return <div className={classNames(highlight && classes.highlightAnimation)} ref={scrollRef}>{children}</div>;
};
