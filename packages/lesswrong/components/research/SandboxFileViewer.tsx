'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { gql } from '@/lib/generated/gql-codegen';
import { useLazyQuery } from '@apollo/client/react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ForumIcon from '@/components/common/ForumIcon';
import Loading from '../vulcan-core/Loading';
import { highlightFile } from './sandboxFileSyntax';
import { researchMono, researchWarmAlpha, researchCanvas, researchScrollbars, researchUiSans } from './researchStyleUtils';
import { formatBytes } from './formatBytes';

const SandboxFileQuery = gql(`
  query ResearchSandboxFile($conversationId: String!, $path: String!) {
    researchSandboxFile(conversationId: $conversationId, path: $path) {
      path
      running
      content
      truncated
      binary
      size
    }
  }
`);

function basename(path: string): string {
  const parts = path.split('/').filter(Boolean);
  return parts[parts.length - 1] ?? path;
}

const styles = defineStyles('SandboxFileViewer', (theme: ThemeType) => ({
  root: {
    position: 'absolute',
    inset: 0,
    zIndex: 5,
    display: 'flex',
    flexDirection: 'column',
    background: researchCanvas(theme),
    fontFamily: researchUiSans,
  },
  header: {
    flex: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    minHeight: 20,
    padding: '8px 10px',
    borderBottom: `1px solid ${researchWarmAlpha(0.08)}`,
    fontFamily: researchMono,
    fontSize: 11,
    color: theme.palette.text.dim,
    userSelect: 'none',
  },
  path: {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: theme.palette.text.primary,
    direction: 'rtl', // truncate the front of a long path, keep the filename
    textAlign: 'left',
  },
  meta: {
    flex: 'none',
    color: researchWarmAlpha(0.4),
  },
  spacer: {
    flex: 1,
  },
  closeButton: {
    flex: 'none',
    width: 22,
    height: 22,
    padding: 0,
    border: 'none',
    borderRadius: 6,
    background: 'transparent',
    color: theme.palette.text.dim,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '&:hover': {
      color: theme.palette.text.primary,
      background: researchWarmAlpha(0.06),
    },
  },
  closeIcon: {
    '--icon-size': '14px',
  },
  truncatedBanner: {
    flex: 'none',
    padding: '5px 12px',
    fontFamily: researchMono,
    fontSize: 11,
    color: theme.palette.text.dim,
    background: researchWarmAlpha(0.05),
    borderBottom: `1px solid ${researchWarmAlpha(0.06)}`,
  },
  body: {
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
    ...researchScrollbars(theme),
  },
  pre: {
    margin: 0,
    padding: '12px 16px',
    fontFamily: researchMono,
    fontSize: 12.5,
    lineHeight: 1.5,
    color: theme.palette.text.primary,
    whiteSpace: 'pre',
    tabSize: 2,
    '& .token.comment, & .token.prolog, & .token.doctype, & .token.cdata': {
      color: theme.palette.lexicalEditor.codeHighlight.tokenComment,
    },
    '& .token.punctuation': {
      color: theme.palette.lexicalEditor.codeHighlight.tokenPunctuation,
    },
    '& .token.property, & .token.tag, & .token.boolean, & .token.number, & .token.constant, & .token.symbol, & .token.deleted': {
      color: theme.palette.lexicalEditor.codeHighlight.tokenProperty,
    },
    '& .token.selector, & .token.attr-name, & .token.string, & .token.char, & .token.builtin, & .token.inserted': {
      color: theme.palette.lexicalEditor.codeHighlight.tokenSelector,
    },
    '& .token.operator, & .token.entity, & .token.url, & .token.variable': {
      color: theme.palette.lexicalEditor.codeHighlight.tokenOperator,
    },
    '& .token.atrule, & .token.attr-value, & .token.keyword': {
      color: theme.palette.lexicalEditor.codeHighlight.tokenAttr,
    },
    '& .token.function, & .token.class-name': {
      color: theme.palette.lexicalEditor.codeHighlight.tokenFunction,
    },
    '& .token.regex, & .token.important': {
      color: theme.palette.lexicalEditor.codeHighlight.tokenVariable,
    },
    '& .token.important, & .token.bold': { fontWeight: 'bold' },
    '& .token.italic': { fontStyle: 'italic' },
  },
  message: {
    padding: '24px 16px',
    fontSize: 13,
    color: theme.palette.text.dim,
    fontStyle: 'italic',
  },
}));

interface SandboxFileViewerProps {
  conversationId: string;
  path: string;
  onClose: () => void;
}

export const SandboxFileViewer = ({ conversationId, path, onClose }: SandboxFileViewerProps) => {
  const classes = useStyles(styles);
  const [loadFile] = useLazyQuery(SandboxFileQuery, { fetchPolicy: 'network-only' });
  const [state, setState] = useState<
    | { status: 'loading' }
    | { status: 'error'; message: string }
    | { status: 'ready'; running: boolean; content: string; truncated: boolean; binary: boolean; size: number }
  >({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    loadFile({ variables: { conversationId, path } })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) { setState({ status: 'error', message: error.message }); return; }
        const f = data?.researchSandboxFile;
        if (!f) { setState({ status: 'error', message: 'No response from server' }); return; }
        setState({ status: 'ready', running: f.running, content: f.content, truncated: f.truncated, binary: f.binary, size: f.size });
      })
      .catch((e: Error) => { if (!cancelled) setState({ status: 'error', message: e.message }); });
    return () => { cancelled = true; };
  }, [loadFile, conversationId, path]);

  useEffect(() => {
    // Capture phase + preventDefault: claim this Escape so outer surfaces
    // (fullscreen chat's exit handler) don't also close on the same press.
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      onClose();
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [onClose]);

  const highlighted = useMemo(() => {
    if (state.status !== 'ready' || state.binary || !state.content) return null;
    return highlightFile(path, state.content);
  }, [state, path]);

  let body: React.ReactNode;
  if (state.status === 'loading') {
    body = <Loading />;
  } else if (state.status === 'error') {
    body = <div className={classes.message}>Couldn’t read this file: {state.message}</div>;
  } else if (!state.running) {
    body = <div className={classes.message}>The sandbox isn’t running. Send a message to start it, then open files here.</div>;
  } else if (state.binary) {
    body = <div className={classes.message}>This looks like a binary file and can’t be shown as text.</div>;
  } else if (state.content.length === 0) {
    body = <div className={classes.message}>This file is empty.</div>;
  } else if (highlighted?.html != null) {
    body = <pre className={classes.pre}><code dangerouslySetInnerHTML={{ __html: highlighted.html }} /></pre>;
  } else {
    body = <pre className={classes.pre}>{state.content}</pre>;
  }

  const showTruncated = state.status === 'ready' && state.truncated;

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <span className={classes.path} title={path}>{basename(path)}</span>
        {state.status === 'ready' && state.running && !state.binary
          ? <span className={classes.meta}>{formatBytes(state.size)}</span>
          : null}
        <span className={classes.spacer} />
        <button
          type="button"
          className={classes.closeButton}
          onClick={onClose}
          title="Close (Esc)"
          aria-label="Close file viewer"
        >
          <ForumIcon icon="Close" className={classes.closeIcon} />
        </button>
      </div>
      {showTruncated ? (
        <div className={classes.truncatedBanner}>Showing the first 512 KB of a larger file.</div>
      ) : null}
      <div className={classes.body}>{body}</div>
    </div>
  );
};
