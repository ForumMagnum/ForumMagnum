'use client';

import React, { useMemo } from 'react';
import classNames from 'classnames';
import { highlightHtmlWithPangramWindowScores } from '@/components/sunshineDashboard/helpers';
import ContentStyles from '@/components/common/ContentStyles';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { pBodyStyle } from '@/themes/stylePiping';
import type { PangramWindowScore, ReviewCollectionName } from '../lib/types';

const styles = defineStyles('SimpleModHighlightedHtml', (theme: ThemeType) => ({
  root: {
    '& p': pBodyStyle(theme),
    '& a': {
      textDecoration: 'none',
    },
    '& a:hover, & a:active': {
      opacity: 0.5,
    },
  },
}));

const HighlightedHtml = ({ html, windowScores, collectionName, className }: {
  html: string | null;
  windowScores: PangramWindowScore[] | null;
  collectionName: ReviewCollectionName;
  className?: string;
}) => {
  const classes = useStyles(styles);
  const rendered = useMemo(() => {
    const safeHtml = html ?? '<p><em>(no content)</em></p>';
    if (typeof window === 'undefined' || !windowScores?.length) {
      return safeHtml;
    }
    return highlightHtmlWithPangramWindowScores(safeHtml, windowScores);
  }, [html, windowScores]);

  return (
    <ContentStyles
      contentType={collectionName === 'Posts' ? 'post' : 'comment'}
      className={classNames('lw-content', classes.root, className)}
    >
      <div dangerouslySetInnerHTML={{ __html: rendered }} />
    </ContentStyles>
  );
};

export default HighlightedHtml;
