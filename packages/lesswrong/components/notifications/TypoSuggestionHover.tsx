'use client';

import React, { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';
import { useNavigate } from '@/lib/routeUtil';
import { postGetEditUrl } from '@/lib/collections/posts/helpers';
import Loading from '../vulcan-core/Loading';

const TypoSuggestionQuery = gql(`
  query TypoSuggestionHoverQuery($documentId: String) {
    typoSuggestion(selector: { documentId: $documentId }) {
      result {
        ...TypoSuggestionsDefaultFragment
      }
    }
  }
`);

const AcceptTypoSuggestionMutation = gql(`
  mutation acceptTypoSuggestionFromHover($suggestionId: String!, $mode: TypoAcceptMode!) {
    acceptTypoSuggestion(suggestionId: $suggestionId, mode: $mode) {
      ...TypoSuggestionsDefaultFragment
    }
  }
`);

const RejectTypoSuggestionMutation = gql(`
  mutation rejectTypoSuggestionFromHover($suggestionId: String!) {
    rejectTypoSuggestion(suggestionId: $suggestionId) {
      ...TypoSuggestionsDefaultFragment
    }
  }
`);

const styles = defineStyles('TypoSuggestionHover', (theme: ThemeType) => ({
  root: {
    padding: 16,
    ...theme.typography.commentStyle,
    ...theme.typography.body2,
    maxWidth: 480,
  },
  flaggedBy: {
    fontSize: 13,
    color: theme.palette.text.dim,
    marginBottom: 8,
  },
  diff: {
    margin: '8px 0',
    padding: 8,
    background: theme.palette.panelBackground.darken02,
    borderRadius: 4,
    fontFamily: theme.typography.code.fontFamily,
    fontSize: 13,
    lineHeight: '20px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  del: {
    background: 'rgba(255, 0, 0, 0.12)',
    textDecoration: 'line-through',
  },
  ins: {
    background: 'rgba(0, 200, 0, 0.18)',
  },
  arrow: {
    margin: '0 6px',
    color: theme.palette.text.dim,
  },
  explanation: {
    fontSize: 13,
    color: theme.palette.text.dim,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  buttons: {
    display: 'flex',
    gap: 8,
    marginTop: 12,
  },
  button: {
    padding: '6px 12px',
    border: theme.palette.greyBorder('1px', 0.2),
    borderRadius: 4,
    cursor: 'pointer',
    background: theme.palette.panelBackground.default,
    fontFamily: 'inherit',
    fontSize: 13,
    '&:hover': {
      background: theme.palette.panelBackground.darken02,
    },
    '&:disabled': {
      cursor: 'default',
      opacity: 0.6,
    },
  },
  primaryButton: {
    background: theme.palette.primary.main,
    color: theme.palette.text.invertedBackgroundText,
    borderColor: theme.palette.primary.main,
    '&:hover': {
      background: theme.palette.primary.dark,
    },
  },
  status: {
    marginTop: 12,
    fontSize: 13,
    color: theme.palette.text.dim,
  },
}));

type ResolveAction = 'apply' | 'suggest' | 'reject';

const TypoSuggestionHover = ({notification}: {
  notification: NotificationsList,
}) => {
  const classes = useStyles(styles);
  const navigate = useNavigate();
  const suggestionId = notification.documentId ?? undefined;
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, loading } = useQuery(TypoSuggestionQuery, {
    variables: { documentId: suggestionId },
    skip: !suggestionId,
  });

  const [accept, { loading: accepting }] = useMutation(AcceptTypoSuggestionMutation);
  const [reject, { loading: rejecting }] = useMutation(RejectTypoSuggestionMutation);

  if (loading) return <div className={classes.root}><Loading /></div>;
  const suggestion = data?.typoSuggestion?.result;
  if (!suggestion) return <div className={classes.root}>This typo suggestion is no longer available.</div>;

  const isPosts = suggestion.collectionName === 'Posts';
  const isResolved = suggestion.status !== 'pending';
  const reactorName = suggestion.reactor?.displayName ?? 'A reader';
  // Diff display is in markdown coordinates (so the narrowed quote/replacement
  // align with the LLM's identified span). Fall back to the reactor's
  // rendered-form quote only if there's no LLM canonical (shouldn't happen
  // post-evaluation for fix_typo verdicts).
  const fullQuote = suggestion.llmCanonicalQuote ?? suggestion.quote;
  const fullReplacement = suggestion.proposedReplacement ?? '';
  const narrowedQuote = suggestion.narrowedQuote ?? fullQuote;
  const narrowedReplacement = suggestion.narrowedReplacement ?? fullReplacement;
  // Find where the narrowed change sits within the original reacted span so
  // the unchanged context renders inline around the diff.
  const narrowedStart = narrowedQuote ? fullQuote.indexOf(narrowedQuote) : -1;
  const hasContext = narrowedStart >= 0;
  const contextPrefix = hasContext ? fullQuote.slice(0, narrowedStart) : '';
  const contextSuffix = hasContext ? fullQuote.slice(narrowedStart + narrowedQuote.length) : '';

  const handleAction = async (action: ResolveAction) => {
    if (!suggestionId) return;
    setActionError(null);
    try {
      if (action === 'apply') {
        await accept({ variables: { suggestionId, mode: 'APPLY' } });
      } else if (action === 'suggest') {
        await accept({ variables: { suggestionId, mode: 'SUGGEST' } });
        navigate(postGetEditUrl(suggestion.documentId));
      } else {
        await reject({ variables: { suggestionId } });
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    }
  };

  const buttonsDisabled = isResolved || accepting || rejecting;

  return (
    <div className={classes.root}>
      <div className={classes.flaggedBy}>
        Flagged by <strong>{reactorName}</strong>
      </div>
      <div className={classes.diff}>
        {hasContext ? (
          <>
            {contextPrefix}
            {narrowedQuote && <span className={classes.del}>{narrowedQuote}</span>}
            {narrowedReplacement && <span className={classes.ins}>{narrowedReplacement}</span>}
            {contextSuffix}
          </>
        ) : (
          <>
            <span className={classes.del}>{fullQuote}</span>
            <span className={classes.arrow}>→</span>
            <span className={classes.ins}>{fullReplacement}</span>
          </>
        )}
      </div>
      {suggestion.explanation && (
        <div className={classes.explanation}>{suggestion.explanation}</div>
      )}
      {!isResolved && (
        <div className={classes.buttons}>
          <button
            type="button"
            className={`${classes.button} ${classes.primaryButton}`}
            onClick={() => handleAction('apply')}
            disabled={buttonsDisabled}
          >
            Apply
          </button>
          {isPosts && (
            <button
              type="button"
              className={classes.button}
              onClick={() => handleAction('suggest')}
              disabled={buttonsDisabled}
            >
              Open in editor
            </button>
          )}
          <button
            type="button"
            className={classes.button}
            onClick={() => handleAction('reject')}
            disabled={buttonsDisabled}
          >
            Reject
          </button>
        </div>
      )}
      {actionError && <div className={classes.status}>Failed: {actionError}</div>}
      {isResolved && (
        <div className={classes.status}>Status: {suggestion.status}</div>
      )}
    </div>
  );
};

export default TypoSuggestionHover;
