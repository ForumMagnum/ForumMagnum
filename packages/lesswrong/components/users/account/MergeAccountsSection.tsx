"use client";
import React, { useCallback, useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { gql } from '@/lib/generated/gql-codegen';
import { useQuery } from '@/lib/crud/useQuery';
import { useMessages } from '@/components/common/withMessages';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { getUserEmail } from '@/lib/collections/users/helpers';
import classNames from 'classnames';

const usersSearchForMergeQuery = gql(`
  query UsersSearchForMerge($query: String!) {
    UsersSearchForMerge(query: $query) {
      ...UsersMergeSearchResult
    }
  }
`);

const mergeAccountsMutation = gql(`
  mutation MergeAccounts($sourceUserId: String!, $targetUserId: String!, $dryRun: Boolean!) {
    MergeAccounts(sourceUserId: $sourceUserId, targetUserId: $targetUserId, dryRun: $dryRun)
  }
`);

const styles = defineStyles('MergeAccountsSection', (theme: ThemeType) => ({
  root: {
    padding: '12px 0',
  },
  description: {
    fontSize: 13,
    color: theme.palette.grey[600],
    marginBottom: 8,
  },
  targetCallout: {
    fontSize: 13,
    marginBottom: 12,
    padding: '8px 10px',
    borderRadius: 4,
    background: theme.palette.greyAlpha(0.05),
    border: theme.palette.greyBorder('1px', 0.15),
  },
  targetLabel: {
    fontWeight: 600,
  },
  searchInput: {
    width: '100%',
    maxWidth: 400,
    padding: '6px 8px',
    fontSize: 14,
    borderRadius: 4,
    border: theme.palette.greyBorder('1px', 0.3),
    fontFamily: 'inherit',
  },
  results: {
    marginTop: 8,
    maxWidth: 400,
    border: theme.palette.greyBorder('1px', 0.15),
    borderRadius: 4,
    overflow: 'hidden',
  },
  resultRow: {
    padding: '6px 8px',
    cursor: 'pointer',
    fontSize: 13,
    borderBottom: theme.palette.greyBorder('1px', 0.08),
    '&:last-child': {
      borderBottom: 'none',
    },
    '&:hover': {
      background: theme.palette.greyAlpha(0.05),
    },
  },
  resultRowSelected: {
    background: theme.palette.greyAlpha(0.1),
    '&:hover': {
      background: theme.palette.greyAlpha(0.1),
    },
  },
  resultName: {
    fontWeight: 600,
  },
  resultMeta: {
    color: theme.palette.grey[600],
    fontSize: 12,
  },
  noResults: {
    padding: '6px 8px',
    fontSize: 13,
    color: theme.palette.grey[600],
  },
  selectedSource: {
    marginTop: 12,
    fontSize: 13,
  },
  warning: {
    color: theme.palette.error.main,
    marginTop: 8,
    fontSize: 13,
  },
  buttonRow: {
    marginTop: 12,
    display: 'flex',
    gap: 8,
  },
  button: {
    textTransform: 'none',
  },
  dangerButton: {
    color: theme.palette.error.main,
    borderColor: theme.palette.error.main,
    textTransform: 'none',
  },
}));

type MergeSearchUser = UsersMergeSearchResult;

const formatUser = (user: MergeSearchUser) => {
  const email = getUserEmail(user);
  const parts = [
    user.username ? `@${user.username}` : null,
    user.slug ? `/${user.slug}` : null,
    email,
    user._id,
  ].filter(Boolean);
  return parts.join(' · ');
};

const MergeAccountsSection = ({ targetUser }: {
  targetUser: { _id: string, displayName: string | null, username: string | null, slug: string | null },
}) => {
  const classes = useStyles(styles);
  const { flash } = useMessages();
  const [searchText, setSearchText] = useState('');
  const [selectedSource, setSelectedSource] = useState<MergeSearchUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [mutate] = useMutation(mergeAccountsMutation);

  const trimmedSearch = searchText.trim();
  const { data } = useQuery(usersSearchForMergeQuery, {
    variables: { query: trimmedSearch },
    skip: trimmedSearch.length < 2,
  });
  const results = (data?.UsersSearchForMerge ?? []).filter(
    (user): user is MergeSearchUser => !!user && user._id !== targetUser._id,
  );

  const runMerge = useCallback(async (dryRun: boolean) => {
    if (!selectedSource) return;
    const sourceLabel = `${selectedSource.displayName} (${selectedSource._id})`;
    const targetLabel = `${targetUser.displayName} (${targetUser._id})`;
    if (!dryRun && !confirm(
      `Merge the SOURCE account\n  ${sourceLabel}\ninto the TARGET account\n  ${targetLabel}?\n\n` +
      `All of the source account's content (posts, comments, votes, karma, etc.) will be transferred to the target account, ` +
      `the target account's username "${targetUser.username ?? targetUser.displayName}" will be preserved, and the source account will be marked as deleted. ` +
      `This cannot be easily undone. Continue?`
    )) {
      return;
    }
    setLoading(true);
    try {
      await mutate({ variables: { sourceUserId: selectedSource._id, targetUserId: targetUser._id, dryRun } });
      flash({ messageString: dryRun
        ? "Dry run complete — check the server logs for the planned changes."
        : "Accounts merged successfully." });
      if (!dryRun) {
        setSelectedSource(null);
        setSearchText('');
      }
    } catch (e: any) {
      flash({ messageString: e.message ?? "Failed to merge accounts" });
    } finally {
      setLoading(false);
    }
  }, [mutate, selectedSource, targetUser, flash]);

  return (
    <div className={classes.root}>
      <div className={classes.description}>
        Merge another (source) account into this one. The source account's content and karma are transferred
        to this account, and the source account is marked deleted.
      </div>

      <div className={classes.targetCallout}>
        <span className={classes.targetLabel}>Target account (kept):</span>{' '}
        {targetUser.displayName} — its username{' '}
        <strong>{targetUser.username ?? targetUser.displayName}</strong> is preserved.
        Pick a <strong>source</strong> account below to merge <em>into</em> this one.
      </div>

      <input
        type="text"
        className={classes.searchInput}
        placeholder="Search source account by email, username, slug, display name, or id"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
      />

      {trimmedSearch.length >= 2 && (
        <div className={classes.results}>
          {results.length === 0 ? (
            <div className={classes.noResults}>No matching users</div>
          ) : results.map((user) => (
            <div
              key={user._id}
              className={classNames(
                classes.resultRow,
                selectedSource?._id === user._id && classes.resultRowSelected,
              )}
              onClick={() => setSelectedSource(user)}
            >
              <div className={classes.resultName}>{user.displayName}</div>
              <div className={classes.resultMeta}>{formatUser(user)}</div>
            </div>
          ))}
        </div>
      )}

      {selectedSource && (
        <>
          <div className={classes.selectedSource}>
            Selected source account: <strong>{selectedSource.displayName}</strong> ({formatUser(selectedSource)})
          </div>
          <div className={classes.warning}>
            This will merge <strong>{selectedSource.displayName}</strong> (source) into{' '}
            <strong>{targetUser.displayName}</strong> (target, kept). The source account will be deleted.
          </div>
          <div className={classes.buttonRow}>
            <Button
              variant="outlined"
              className={classes.button}
              onClick={() => runMerge(true)}
              disabled={loading}
            >
              {loading ? "Working…" : "Dry run (log only)"}
            </Button>
            <Button
              variant="outlined"
              className={classes.dangerButton}
              onClick={() => runMerge(false)}
              disabled={loading}
            >
              {loading ? "Working…" : "Merge into this account"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default MergeAccountsSection;
