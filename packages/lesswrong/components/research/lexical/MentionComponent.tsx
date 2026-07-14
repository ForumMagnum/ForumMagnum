'use client';

import React, { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ForumIcon, { type ForumIconName } from '@/components/common/ForumIcon';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';
import {
  $getSelection,
  $isNodeSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  KEY_ENTER_COMMAND,
  type BaseSelection,
  type NodeKey,
} from 'lexical';
import type { MentionKind } from './mentionFormat';
import { useResearchNavigationContext } from './ResearchEditorContext';
import { researchWarmAlpha, researchRadius } from '../researchStyleUtils';

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
    borderRadius: researchRadius.xs,
    background: researchWarmAlpha(0.06),
    border: theme.palette.greyBorder('1px', 0.08),
    color: theme.palette.text.primary,
    fontSize: '0.95em',
    lineHeight: 1.4,
    whiteSpace: 'nowrap',
    verticalAlign: 'baseline',
    userSelect: 'none',
    cursor: 'default',
    '&:hover': {
      background: researchWarmAlpha(0.1),
    },
  },
  selected: {
    outline: `2px solid ${theme.palette.primary.main}`,
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

export function MentionComponent({ nodeKey, kind, id, title }: MentionComponentProps) {
  const classes = useStyles(styles);
  const [editor] = useLexicalComposerContext();
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
  const [selection, setSelection] = useState<BaseSelection | null>(null);
  const ref = useRef<HTMLSpanElement>(null);
  const nav = useResearchNavigationContext();

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        setSelection(editorState.read(() => $getSelection()));
      }),
      editor.registerCommand<MouseEvent>(
        CLICK_COMMAND,
        (event) => {
          const target = event.target;
          if (!(target instanceof Node) || !ref.current?.contains(target)) {
            return false;
          }
          if (!event.shiftKey) {
            clearSelection();
          }
          setSelected(!isSelected);
          return true;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand<KeyboardEvent>(
        KEY_ENTER_COMMAND,
        (event) => {
          // Defer to host shortcuts like Cmd/Ctrl+Enter-to-send.
          if (event?.metaKey || event?.ctrlKey) return false;
          const latestSelection = $getSelection();
          if (!$isNodeSelection(latestSelection)) return false;
          if (!latestSelection.has(nodeKey) || latestSelection.getNodes().length !== 1) return false;
          // Self-referential doc nav (already in this doc) is a no-op.
          if (kind === 'doc' && nav.host?.kind === 'document' && nav.host.documentId === id) return false;
          // From within a chat composer, block all conversation navigation:
          // switching would unmount the composer and discard the in-progress
          // draft. Doc navigation from chat is fine (composer stays mounted in
          // the right pane).
          if (kind === 'conv' && nav.host?.kind === 'conversation') return false;
          event?.preventDefault();
          if (kind === 'doc') nav.navigateToDocument(id);
          else if (kind === 'conv') nav.openConversation(id);
          return true;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [clearSelection, editor, id, isSelected, kind, nav, nodeKey, setSelected]);

  // Only show the outline when the chip is the active NodeSelection; a
  // RangeSelection that crosses the chip would otherwise also light it up.
  const isFocused = $isNodeSelection(selection) && isSelected;

  return (
    <span
      ref={ref}
      className={classNames(classes.root, isFocused && classes.selected)}
      data-testid="research-mention-chip"
    >
      <ForumIcon icon={KIND_ICON[kind]} className={classes.icon} />
      <span className={classNames(classes.title, !title && classes.empty)}>
        {title || '(untitled)'}
      </span>
    </span>
  );
}
