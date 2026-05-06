'use client';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  SELECTION_CHANGE_COMMAND,
  getDOMSelection,
} from 'lexical';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { newResearchAnchorId } from './ResearchAnchorContext';
import { WRAP_SELECTION_AS_RESEARCH_ANCHOR_COMMAND } from './ResearchAnchorPlugin';
import { INSERT_AGENT_BLOCK_COMMAND } from './AgentBlockPlugin';
import { useResearchEditorEnvironment } from './ResearchEditorContext';

const styles = defineStyles('ResearchSelectionToolbar', (theme: ThemeType) => ({
  toolbar: {
    position: 'absolute',
    zIndex: 100,
    background: theme.palette.panelBackground.default,
    border: theme.palette.greyBorder('1px', 0.2),
    borderRadius: 4,
    boxShadow: theme.palette.boxShadow.default,
    padding: 4,
    display: 'flex',
    alignItems: 'center',
  },
  button: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 10px',
    fontSize: '0.85em',
    color: theme.palette.text.normal,
    borderRadius: 3,
    '&:hover': {
      background: theme.palette.greyAlpha(0.08),
    },
    '&:disabled': {
      cursor: 'not-allowed',
      color: theme.palette.greyAlpha(0.4),
    },
  },
}));

interface ToolbarPos {
  top: number;
  left: number;
}

export function ResearchSelectionToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const env = useResearchEditorEnvironment();
  const classes = useStyles(styles);

  const [pos, setPos] = useState<ToolbarPos | null>(null);
  const [pending, setPending] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const updatePosition = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection) || selection.isCollapsed()) {
        setPos(null);
        return;
      }
      const native = getDOMSelection(editor._window);
      if (!native || native.rangeCount === 0) {
        setPos(null);
        return;
      }
      const rect = native.getRangeAt(0).getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        setPos(null);
        return;
      }
      // Position above the selection in document coordinates so the portal
      // (rendered into document.body) lines up correctly while scrolling.
      setPos({
        top: rect.top + window.scrollY - 36,
        left: rect.left + window.scrollX,
      });
    });
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => updatePosition());
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updatePosition();
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor, updatePosition]);

  useEffect(() => {
    const handler = () => updatePosition();
    window.addEventListener('resize', handler);
    window.addEventListener('scroll', handler, true);
    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('scroll', handler, true);
    };
  }, [updatePosition]);

  const fireAsQuery = useCallback(async () => {
    if (pending) return;
    const anchorId = newResearchAnchorId();

    // Wrap selection in a ResearchAnchor mark.
    let wrapped = false;
    editor.update(() => {
      wrapped = editor.dispatchCommand(WRAP_SELECTION_AS_RESEARCH_ANCHOR_COMMAND, {
        anchorId,
      });
    });
    if (!wrapped) return;

    setPending(true);
    try {
      const { conversationId } = await env.fireDocumentQuery({
        documentId: env.documentId,
        anchorId,
      });

      editor.update(() => {
        editor.dispatchCommand(INSERT_AGENT_BLOCK_COMMAND, {
          conversationId,
          placement: 'after-selection',
        });
      });
    } catch (err) {
      // Non-fatal: leave the anchor in place; user can retry. Surface to console for now.
      // eslint-disable-next-line no-console
      console.error('[research] fireDocumentQuery failed', err);
    } finally {
      setPending(false);
    }
  }, [editor, env, pending]);

  if (!pos) return null;

  return createPortal(
    <div
      ref={containerRef}
      className={classes.toolbar}
      style={{ top: pos.top, left: pos.left }}
      // Prevent the popover itself from collapsing the selection on click.
      onMouseDown={(e) => e.preventDefault()}
    >
      <button
        type="button"
        className={classes.button}
        onClick={fireAsQuery}
        disabled={pending}
      >
        {pending ? 'Firing…' : 'Fire as query'}
      </button>
    </div>,
    document.body,
  );
}
