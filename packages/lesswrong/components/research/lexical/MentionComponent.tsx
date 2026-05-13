'use client';

import React from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ForumIcon, { type ForumIconName } from '@/components/common/ForumIcon';
import type { NodeKey } from 'lexical';
import type { MentionKind } from './mentionFormat';

const KIND_ICON: Record<MentionKind, ForumIconName> = {
  doc: 'Document',
  conv: 'ChatBubbleLeftRight',
};

const styles = defineStyles('MentionComponent', (theme: ThemeType) => ({
  root: {
    display: 'inline-flex',
    alignItems: 'baseline',
    gap: 4,
    padding: '0 6px 0 4px',
    margin: '0 1px',
    borderRadius: 4,
    background: theme.palette.greyAlpha(0.06),
    border: theme.palette.greyBorder('1px', 0.08),
    color: theme.palette.text.primary,
    fontSize: '0.95em',
    lineHeight: 1.4,
    whiteSpace: 'nowrap',
    verticalAlign: 'baseline',
    userSelect: 'none',
    cursor: 'default',
    '&:hover': {
      background: theme.palette.greyAlpha(0.1),
    },
  },
  icon: {
    flex: 'none',
    alignSelf: 'center',
    color: theme.palette.text.dim,
    '--icon-size': '12px',
  },
  title: {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  empty: {
    fontStyle: 'italic',
    color: theme.palette.text.dim,
  },
}));

interface MentionComponentProps {
  nodeKey: NodeKey;
  kind: MentionKind;
  id: string;
  title: string;
}

export function MentionComponent({ kind, title }: MentionComponentProps) {
  const classes = useStyles(styles);
  return (
    <span className={classes.root} data-testid="research-mention-chip">
      <ForumIcon icon={KIND_ICON[kind]} className={classes.icon} />
      <span className={classNames(classes.title, !title && classes.empty)}>
        {title || '(untitled)'}
      </span>
    </span>
  );
}
