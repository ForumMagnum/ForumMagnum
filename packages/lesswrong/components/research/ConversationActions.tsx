'use client';

import React, { useCallback, useState } from 'react';
import { gql } from '@/lib/generated/gql-codegen';
import { useApolloClient, useMutation } from '@apollo/client/react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useMessages } from '@/components/common/withMessages';
import { isSandboxWarmingError } from './sandboxWarming';
import { researchMono, researchWarmAlpha, researchRadius } from './researchStyleUtils';

const SaveResearchEnvironmentMutation = gql(`
  mutation SaveResearchEnvironment($conversationId: String!, $withConversation: Boolean!) {
    saveResearchEnvironment(conversationId: $conversationId, withConversation: $withConversation) {
      data { _id label }
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

/** How often to re-poll `mintDevPreviewUrl` while the sandbox is resuming. */
const WARMING_RETRY_MS = 3000;
/** Give up on a resume after this long — matches sandbox boot worst cases. */
const WARMING_DEADLINE_MS = 3 * 60 * 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
}));

export function ConversationActions({ conversationId }: { conversationId: string }) {
  const classes = useStyles(styles);
  const { flash } = useMessages();
  const apollo = useApolloClient();
  const [saveEnvironment] = useMutation(SaveResearchEnvironmentMutation);
  const [mintPreview] = useMutation(MintDevPreviewUrlMutation);
  const [busy, setBusy] = useState(false);
  const [warming, setWarming] = useState(false);

  const handleSave = useCallback(async (withConversation: boolean) => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await saveEnvironment({ variables: { conversationId, withConversation } });
      const label = result.data?.saveResearchEnvironment?.data?.label;
      // Surface the new environment in the selector immediately (the redesign's
      // "save, then start from it" workflow): drop the cached project env-list so
      // a not-yet-mounted cache-first selector refetches on mount, then refetch
      // any selector that's currently mounted.
      apollo.cache.evict({ fieldName: 'researchEnvironments' });
      apollo.cache.gc();
      await apollo.refetchQueries({ include: ['ResearchEnvironmentsByProjectQuery'] });
      flash({ messageString: label ? `Saved environment "${label}"` : 'Saved environment', type: 'success' });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[research] save environment failed', err);
      flash({ messageString: `Failed to save environment: ${(err as Error).message}`, type: 'error' });
    } finally {
      setBusy(false);
    }
  }, [busy, conversationId, saveEnvironment, apollo, flash]);

  const handlePreview = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    // Open the tab synchronously, inside the click gesture: if the sandbox is
    // stopped, minting blocks on the resume for long enough that a deferred
    // window.open would be popup-blocked.
    const tab = window.open('', '_blank');
    tab?.document.write('Starting sandbox… this tab will load the preview when it’s ready.');
    try {
      const deadline = Date.now() + WARMING_DEADLINE_MS;
      for (;;) {
        try {
          const result = await mintPreview({ variables: { conversationId } });
          const url = result.data?.mintDevPreviewUrl?.url;
          if (url) {
            if (tab && !tab.closed) {
              tab.location.href = url;
            } else {
              window.open(url, '_blank', 'noopener,noreferrer');
            }
          } else {
            tab?.close();
            flash({ messageString: 'Could not open a preview link.', type: 'error' });
          }
          return;
        } catch (err) {
          // A stopped sandbox resumes server-side and rejects with
          // SANDBOX_WARMING until it's reachable — keep re-minting.
          if (isSandboxWarmingError(err) && Date.now() < deadline) {
            setWarming(true);
            await sleep(WARMING_RETRY_MS);
            continue;
          }
          tab?.close();
          // eslint-disable-next-line no-console
          console.error('[research] mint preview failed', err);
          flash({ messageString: `Failed to open preview: ${(err as Error).message}`, type: 'error' });
          return;
        }
      }
    } finally {
      setBusy(false);
      setWarming(false);
    }
  }, [busy, conversationId, mintPreview, flash]);

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
        className={classes.button}
        disabled={busy}
        onClick={handlePreview}
        title="Open the sandbox's dev-server preview (restarts the sandbox if it has stopped)"
      >
        {warming ? 'starting…' : 'preview'}
      </button>
    </div>
  );
}
