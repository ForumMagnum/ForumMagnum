'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { gql } from '@/lib/generated/gql-codegen';
import { useApolloClient, useLazyQuery, useMutation } from '@apollo/client/react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useMessages } from '@/components/common/withMessages';
import { isSandboxWarmingError, retryWhileSandboxWarming } from './sandboxWarming';
import { ResearchEnvironmentsByProjectQuery } from './researchEnvironmentsQuery';
import { researchMono, researchWarmAlpha, researchRadius, researchChatSurface } from './researchStyleUtils';

const SaveResearchEnvironmentMutation = gql(`
  mutation SaveResearchEnvironment($conversationId: String!, $withConversation: Boolean!) {
    saveResearchEnvironment(conversationId: $conversationId, withConversation: $withConversation) {
      data { _id label sourceEventId createdAt }
    }
  }
`);

const MintDevPreviewUrlMutation = gql(`
  mutation MintDevPreviewUrl($conversationId: String!) {
    mintDevPreviewUrl(conversationId: $conversationId) {
      url
    }
  }
`);

const RestartResearchSandboxMutation = gql(`
  mutation RestartResearchSandbox($conversationId: String!) {
    restartResearchSandbox(conversationId: $conversationId) {
      running
    }
  }
`);

const ResearchSandboxRunningQuery = gql(`
  query ResearchSandboxRunning($conversationId: String!) {
    researchSandboxRunning(conversationId: $conversationId)
  }
`);

const PREVIEW_FEEDBACK_DELAY_MS = 4000;

const styles = defineStyles('ConversationActions', (theme: ThemeType) => ({
  root: {
    display: 'flex',
    flexWrap: 'nowrap',
    flexShrink: 0,
    justifyContent: 'flex-end',
    gap: 2,
    alignItems: 'center',
  },
  button: {
    flexShrink: 0,
    whiteSpace: 'nowrap',
    background: 'transparent',
    border: 'none',
    borderRadius: researchRadius.xs,
    fontFamily: researchMono,
    fontSize: 10.5,
    lineHeight: 1.4,
    color: theme.palette.text.dim,
    padding: '2px 6px',
    cursor: 'pointer',
    '&:hover': {
      color: theme.palette.text.primary,
      background: researchWarmAlpha(0.06),
    },
    '&:disabled': {
      opacity: 0.5,
      cursor: 'default',
    },
  },
  menu: {
    position: 'fixed',
    zIndex: 1000,
    background: researchChatSurface(theme),
    border: `1px solid ${researchWarmAlpha(0.16)}`,
    borderRadius: researchRadius.sm,
    boxShadow: `0 4px 16px ${researchWarmAlpha(0.14)}`,
    overflow: 'hidden',
  },
  menuItem: {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    border: 'none',
    background: 'transparent',
    fontFamily: researchMono,
    fontSize: 11,
    lineHeight: 1.4,
    color: theme.palette.text.primary,
    padding: '6px 10px',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    textDecoration: 'none',
    '&:hover': {
      background: researchWarmAlpha(0.06),
    },
  },
  menuStatus: {
    fontFamily: researchMono,
    fontSize: 11,
    lineHeight: 1.4,
    color: theme.palette.text.dim,
    padding: '6px 10px',
    whiteSpace: 'nowrap',
  },
}));

type RestartMenuState = 'idle' | 'starting' | 'ready';

interface RestartMenuAnchor {
  right: number;
  top: number;
}

interface RestartSandboxMenuProps {
  anchor: RestartMenuAnchor;
  state: RestartMenuState;
  readyUrl: string | null;
  onRestart: () => void;
  onClose: () => void;
}

const RestartSandboxMenu = ({ anchor, state, readyUrl, onRestart, onClose }: RestartSandboxMenuProps) => {
  const classes = useStyles(styles);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const onPointerDown = (e: PointerEvent) => {
      if (menuRef.current && e.target instanceof Node && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown, true);
    };
  }, [onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    // data-research-popover: exempts the menu from the agent block's
    // click-out collapse (the portal lives outside the block root, so without
    // it the block blurs — unmounting this menu — before the click lands).
    <div
      ref={menuRef}
      className={classes.menu}
      style={{ right: anchor.right, top: anchor.top }}
      data-research-popover=""
    >
      {state === 'idle' && (
        <button type="button" className={classes.menuItem} onClick={onRestart}>
          Restart sandbox
        </button>
      )}
      {state === 'starting' && (
        <div className={classes.menuStatus}>Starting sandbox…</div>
      )}
      {state === 'ready' && readyUrl && (
        <a
          className={classes.menuItem}
          href={readyUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
        >
          Open preview
        </a>
      )}
    </div>,
    document.body,
  );
};

function openPreviewPlaceholderWindow(): Window | null {
  const previewWindow = window.open('', '_blank');
  if (!previewWindow) return null;

  previewWindow.opener = null;
  previewWindow.document.title = 'Starting sandbox preview';
  previewWindow.document.body.textContent = 'Starting sandbox preview...';
  previewWindow.document.body.style.fontFamily = 'system-ui, sans-serif';
  previewWindow.document.body.style.padding = '2rem';
  previewWindow.document.body.style.color = '#333';
  return previewWindow;
}

function closePreviewPlaceholderWindow(previewWindow: Window | null): void {
  if (previewWindow && !previewWindow.closed) {
    previewWindow.close();
  }
}

function navigatePreviewWindow(previewWindow: Window | null, url: string): boolean {
  if (previewWindow && !previewWindow.closed) {
    previewWindow.location.href = url;
    return true;
  }
  const opened = window.open(url, '_blank', 'noopener,noreferrer');
  return Boolean(opened);
}

export function ConversationActions({ conversationId, projectId }: {
  conversationId: string;
  projectId: string;
}) {
  const classes = useStyles(styles);
  const { flash } = useMessages();
  const apollo = useApolloClient();
  const [saveEnvironment] = useMutation(SaveResearchEnvironmentMutation);
  const [mintPreview] = useMutation(MintDevPreviewUrlMutation);
  const [restartSandbox] = useMutation(RestartResearchSandboxMutation);
  const [checkRunning] = useLazyQuery(ResearchSandboxRunningQuery, { fetchPolicy: 'network-only' });
  const [busy, setBusy] = useState(false);
  const [restartMenu, setRestartMenu] = useState<RestartMenuAnchor | null>(null);
  const [restartState, setRestartState] = useState<RestartMenuState>('idle');
  const [readyUrl, setReadyUrl] = useState<string | null>(null);
  const previewButtonRef = useRef<HTMLButtonElement>(null);
  const restartAbortRef = useRef(false);

  const handleSave = useCallback(async (withConversation: boolean) => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await saveEnvironment({ variables: { conversationId, withConversation } });
      const saved = result.data?.saveResearchEnvironment?.data;
      // Surface the new environment everywhere immediately (sidebar snapshots,
      // the env selector — both read this exact query) by prepending it to the
      // cached list (the byProject view sorts createdAt desc). This must be a
      // targeted cache write, NOT an evict + refetch: evicting the field made
      // the crud useQuery's SSR/suspense machinery re-serve the stale
      // SSR-captured list over the refetch, so the fresh snapshot appeared and
      // then vanished until a full reload.
      if (saved) {
        apollo.cache.updateQuery(
          { query: ResearchEnvironmentsByProjectQuery, variables: { projectId } },
          (existing) => {
            if (!existing?.researchEnvironments?.results) return existing;
            const results = existing.researchEnvironments.results;
            if (results.some((env) => env._id === saved._id)) return existing;
            return {
              ...existing,
              researchEnvironments: {
                ...existing.researchEnvironments,
                results: [saved, ...results],
              },
            };
          },
        );
      }
      const label = saved?.label;
      flash({ messageString: label ? `Saved environment "${label}"` : 'Saved environment', type: 'success' });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[research] save environment failed', err);
      flash({ messageString: `Failed to save environment: ${(err as Error).message}`, type: 'error' });
    } finally {
      setBusy(false);
    }
  }, [busy, conversationId, projectId, saveEnvironment, apollo, flash]);

  const closeRestartMenu = useCallback(() => {
    restartAbortRef.current = true;
    setRestartMenu(null);
    setRestartState('idle');
    setReadyUrl(null);
  }, []);

  const openRestartMenu = useCallback((state: RestartMenuState = 'idle', url: string | null = null) => {
    const rect = previewButtonRef.current?.getBoundingClientRect();
    if (!rect) return;
    setRestartMenu({ right: window.innerWidth - rect.right, top: rect.bottom + 4 });
    setRestartState(state);
    setReadyUrl(url);
  }, []);

  const handleRestart = useCallback(async () => {
    const previewWindow = openPreviewPlaceholderWindow();
    restartAbortRef.current = false;
    setRestartState('starting');
    try {
      const restartResult = await retryWhileSandboxWarming(
        () => restartSandbox({ variables: { conversationId } }),
        () => restartAbortRef.current,
      );
      if (!restartResult) {
        closePreviewPlaceholderWindow(previewWindow);
        return;
      }
      const result = await retryWhileSandboxWarming(
        () => mintPreview({ variables: { conversationId } }),
        () => restartAbortRef.current,
      );
      if (!result) {
        closePreviewPlaceholderWindow(previewWindow);
        return;
      }
      const url = result.data?.mintDevPreviewUrl?.url;
      if (!url) {
        closePreviewPlaceholderWindow(previewWindow);
        closeRestartMenu();
        flash({ messageString: 'Could not open a preview link.', type: 'error' });
        return;
      }
      if (navigatePreviewWindow(previewWindow, url)) {
        closeRestartMenu();
      } else {
        openRestartMenu('ready', url);
      }
    } catch (err) {
      closePreviewPlaceholderWindow(previewWindow);
      closeRestartMenu();
      // eslint-disable-next-line no-console
      console.error('[research] restart sandbox failed', err);
      flash({ messageString: `Failed to restart sandbox: ${(err as Error).message}`, type: 'error' });
    }
  }, [conversationId, restartSandbox, mintPreview, flash, closeRestartMenu, openRestartMenu]);

  const handlePreview = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    const previewWindow = openPreviewPlaceholderWindow();
    const feedbackTimer = window.setTimeout(() => {
      openRestartMenu('starting');
    }, PREVIEW_FEEDBACK_DELAY_MS);
    try {
      const check = await checkRunning({ variables: { conversationId } });
      if (!check.data?.researchSandboxRunning) {
        closePreviewPlaceholderWindow(previewWindow);
        openRestartMenu('idle');
        return;
      }
      const result = await mintPreview({ variables: { conversationId } });
      const url = result.data?.mintDevPreviewUrl?.url;
      if (url) {
        if (navigatePreviewWindow(previewWindow, url)) {
          closeRestartMenu();
        } else {
          openRestartMenu('ready', url);
        }
      } else {
        closePreviewPlaceholderWindow(previewWindow);
        flash({ messageString: 'Could not open a preview link.', type: 'error' });
      }
    } catch (err) {
      closePreviewPlaceholderWindow(previewWindow);
      if (isSandboxWarmingError(err)) {
        openRestartMenu('idle');
        return;
      }
      // eslint-disable-next-line no-console
      console.error('[research] mint preview failed', err);
      flash({ messageString: `Failed to open preview: ${(err as Error).message}`, type: 'error' });
    } finally {
      window.clearTimeout(feedbackTimer);
      setBusy(false);
    }
  }, [busy, conversationId, checkRunning, mintPreview, openRestartMenu, closeRestartMenu, flash]);

  return (
    <div className={classes.root}>
      <button
        type="button"
        className={classes.button}
        disabled={busy}
        onClick={() => handleSave(true)}
        title="Save this sandbox as a reusable environment, including the conversation"
      >
        save+chat
      </button>
      <button
        type="button"
        className={classes.button}
        disabled={busy}
        onClick={() => handleSave(false)}
        title="Save this sandbox as a reusable environment, without the conversation"
      >
        save
      </button>
      <button
        type="button"
        ref={previewButtonRef}
        className={classes.button}
        disabled={busy}
        onClick={handlePreview}
        title="Open the sandbox's dev-server preview"
      >
        preview
      </button>
      {restartMenu && (
        <RestartSandboxMenu
          anchor={restartMenu}
          state={restartState}
          readyUrl={readyUrl}
          onRestart={handleRestart}
          onClose={closeRestartMenu}
        />
      )}
    </div>
  );
}
