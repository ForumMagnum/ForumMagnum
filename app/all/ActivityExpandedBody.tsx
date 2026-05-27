"use client";

import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ContentStyles from '@/components/common/ContentStyles';
import { ContentItemBody } from '@/components/contents/ContentItemBody';

// The actual HTML body rendered inside an expanded row. ContentStyles handles
// theme-aware typography for post highlights vs comment content.
const styles = defineStyles('ActivityExpandedBody', (theme: ThemeType) => ({
  expandedBody: {
    fontSize: 16,
    marginLeft: 42,
    color: theme.palette.greyAlpha(0.85),
    '& p': {
      margin: '0 0 0.6em',
    },
    '& p:last-child': {
      marginBottom: 0,
    },
  },
  emptyContent: {
    fontSize: 13,
    fontStyle: 'italic',
    color: theme.palette.greyAlpha(0.5),
  },
}));

interface ActivityExpandedBodyProps {
  html: string;
  contentType: 'postHighlight' | 'comment';
  description: string;
  emptyText: string;
}

const ActivityExpandedBody = ({html, contentType, description, emptyText}: ActivityExpandedBodyProps) => {
  const classes = useStyles(styles);
  if (!html) return <div className={classes.emptyContent}>{emptyText}</div>;
  return (
    <ContentStyles contentType={contentType} className={classes.expandedBody}>
      <ContentItemBody dangerouslySetInnerHTML={{ __html: html }} description={description} />
    </ContentStyles>
  );
};

export default ActivityExpandedBody;
