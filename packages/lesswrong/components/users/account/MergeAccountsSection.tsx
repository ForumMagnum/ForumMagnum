"use client";
import React, { useCallback, useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { gql } from '@/lib/generated/gql-codegen';
import { useQuery } from '@/lib/crud/useQuery';
import { useMessages } from '@/components/common/withMessages';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { getUserEmail } from '@/lib/collections/users/helpers';
import ForumIcon from '@/components/common/ForumIcon';
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
    MergeAccounts(sourceUserId: $sourceUserId, targetUserId: $targetUserId, dryRun: $dryRun) {
      success
      failures {
        stage
        message
        collectionName
        documentId
      }
    }
  }
`);

const styles = defineStyles('MergeAccountsSection', (theme: ThemeType) => ({
  root: {
    padding: '12px 0',
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  description: {
    fontSize: 13,
    lineHeight: 1.5,
    color: theme.palette.grey[600],
    marginBottom: 12,
    maxWidth: 560,
  },
  searchInput: {
    width: '100%',
    maxWidth: 420,
    padding: '8px 12px',
    fontSize: 14,
    borderRadius: 6,
    border: theme.palette.greyBorder('1px', 0.25),
    fontFamily: theme.palette.fonts.sansSerifStack,
    transition: 'border-color 0.15s, box-shadow 0.15s',
    '&:focus': {
      outline: 'none',
      borderColor: theme.palette.primary.main,
      boxShadow: `0 0 0 3px ${theme.palette.primaryAlpha(0.12)}`,
    },
    '&::placeholder': {
      color: theme.palette.grey[500],
    },
  },
  results: {
    marginTop: 8,
    maxWidth: 420,
    border: theme.palette.greyBorder('1px', 0.15),
    borderRadius: 6,
    overflow: 'hidden',
    boxShadow: `0 1px 3px ${theme.palette.greyAlpha(0.06)}`,
  },
  resultRow: {
    padding: '8px 12px',
    cursor: 'pointer',
    borderBottom: theme.palette.greyBorder('1px', 0.08),
    transition: 'background 0.1s',
    '&:last-child': {
      borderBottom: 'none',
    },
    '&:hover': {
      background: theme.palette.greyAlpha(0.04),
    },
  },
  resultRowSelected: {
    background: theme.palette.primaryAlpha(0.08),
    '&:hover': {
      background: theme.palette.primaryAlpha(0.08),
    },
  },
  resultName: {
    fontWeight: 600,
    fontSize: 14,
    color: theme.palette.grey[900],
  },
  resultMeta: {
    color: theme.palette.grey[600],
    fontSize: 12,
    marginTop: 1,
  },
  noResults: {
    padding: '8px 12px',
    fontSize: 13,
    color: theme.palette.grey[600],
  },

  // Account comparison cards
  comparison: {
    display: 'flex',
    alignItems: 'stretch',
    gap: 12,
    marginTop: 16,
    maxWidth: 640,
    flexWrap: 'wrap',
  },
  card: {
    flex: '1 1 240px',
    minWidth: 240,
    borderRadius: 8,
    padding: '14px 16px',
    background: theme.palette.panelBackground.default,
    border: theme.palette.greyBorder('1px', 0.15),
    boxShadow: `0 1px 4px ${theme.palette.greyAlpha(0.05)}`,
  },
  cardTarget: {
    borderColor: theme.palette.primaryAlpha(0.4),
    background: theme.palette.primaryAlpha(0.04),
  },
  cardSource: {
    borderColor: theme.palette.greyAlpha(0.18),
  },
  cardArrow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.palette.grey[500],
    fontSize: 22,
    flex: '0 0 auto',
    alignSelf: 'center',
  },
  cardRole: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  cardRoleSource: {
    color: theme.palette.error.main,
  },
  cardRoleTarget: {
    color: theme.palette.primary.main,
  },
  metaList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  metaRow: {
    display: 'flex',
    alignItems: 'baseline',
    fontSize: 13,
    lineHeight: 1.4,
  },
  metaLabel: {
    flex: '0 0 92px',
    color: theme.palette.grey[500],
    fontWeight: 500,
  },
  metaValue: {
    flex: 1,
    color: theme.palette.grey[800],
    fontWeight: 600,
    wordBreak: 'break-all',
  },
  serviceChips: {
    display: 'inline-flex',
    flexWrap: 'wrap',
    gap: 4,
  },
  serviceChip: {
    display: 'inline-block',
    padding: '1px 7px',
    borderRadius: 10,
    fontSize: 11,
    fontWeight: 600,
    color: theme.palette.primary.main,
    background: theme.palette.primaryAlpha(0.12),
    border: `1px solid ${theme.palette.primaryAlpha(0.25)}`,
  },

  warning: {
    color: theme.palette.error.main,
    marginTop: 14,
    fontSize: 13,
    lineHeight: 1.5,
    maxWidth: 640,
  },
  status: {
    marginTop: 10,
    fontSize: 13,
    color: theme.palette.grey[600],
  },
  failureList: {
    marginTop: 10,
    fontSize: 13,
    color: theme.palette.error.main,
  },
  failureItem: {
    marginTop: 4,
  },
  buttonRow: {
    marginTop: 16,
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
type MergeResult = MergeAccountsMutation["MergeAccounts"];
type MergeFailure = MergeResult["failures"][number];

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

const formatFailure = (failure: MergeFailure) => {
  const location = [
    failure.collectionName,
    failure.documentId,
  ].filter(Boolean).join(" ");
  return location ? `${failure.stage} (${location}): ${failure.message}` : `${failure.stage}: ${failure.message}`;
};

interface AccountDetailFields {
  _id: string;
  username: string | null;
  displayName: string | null;
  slug: string | null;
  karma: number | null;
  postCount: number | null;
  commentCount: number | null;
  email: string | null;
  emails?: UsersCurrent["emails"] | null;
  createdAt: Date | string | null;
  associatedOAuthServices: string[] | null;
}

const OAUTH_SERVICE_LABELS: Record<string, string> = {
  google: "Google",
  github: "GitHub",
  facebook: "Facebook",
  linkedin: "LinkedIn",
};

const formatNumber = (value: number | null) => (value ?? 0).toLocaleString();

const formatDate = (value: Date | string | null) => {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const AccountCard = ({ user, role }: {
  user: AccountDetailFields,
  role: "source" | "target",
}) => {
  const classes = useStyles(styles);
  const isTarget = role === "target";
  const services = user.associatedOAuthServices ?? [];
  const rows: Array<[string, React.ReactNode]> = [
    ["Display name", user.displayName ?? "—"],
    ["Username", user.username ? `@${user.username}` : "—"],
    ["Slug", user.slug ? `/${user.slug}` : "—"],
    ["Email", getUserEmail(user) ?? "—"],
    ["ID", user._id],
    ["Created", formatDate(user.createdAt)],
    ["Karma", formatNumber(user.karma)],
    ["Posts", formatNumber(user.postCount)],
    ["Comments", formatNumber(user.commentCount)],
    ["Services", services.length > 0
      ? (
        <span className={classes.serviceChips}>
          {services.map((service) => (
            <span key={service} className={classes.serviceChip}>
              {OAUTH_SERVICE_LABELS[service] ?? service}
            </span>
          ))}
        </span>
      )
      : "—"],
  ];
  return (
    <div className={classNames(classes.card, isTarget ? classes.cardTarget : classes.cardSource)}>
      <div className={classNames(classes.cardRole, isTarget ? classes.cardRoleTarget : classes.cardRoleSource)}>
        {isTarget ? "Target — kept" : "Source — deleted"}
      </div>
      <div className={classes.metaList}>
        {rows.map(([label, value]) => (
          <div key={label} className={classes.metaRow}>
            <span className={classes.metaLabel}>{label}</span>
            <span className={classes.metaValue}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const MergeAccountsSection = ({ targetUser }: {
  targetUser: AccountDetailFields,
}) => {
  const classes = useStyles(styles);
  const { flash } = useMessages();
  const [searchText, setSearchText] = useState('');
  const [selectedSource, setSelectedSource] = useState<MergeSearchUser | null>(null);
  const [activeAction, setActiveAction] = useState<"dryRun" | "merge" | null>(null);
  const [lastResult, setLastResult] = useState<MergeResult | null>(null);
  const [mutate] = useMutation(mergeAccountsMutation);
  const loading = activeAction !== null;

  const trimmedSearch = searchText.trim();
  const { data } = useQuery(usersSearchForMergeQuery, {
    variables: { query: trimmedSearch },
    skip: trimmedSearch.length < 2,
  });
  const results = (data?.UsersSearchForMerge ?? []).filter(
    (user): user is MergeSearchUser => !!user && user._id !== targetUser._id,
  );

  const runMerge = useCallback(async (dryRun: boolean) => {
    if (!selectedSource || loading) return;
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
    setActiveAction(dryRun ? "dryRun" : "merge");
    setLastResult(null);
    try {
      const { data } = await mutate({ variables: { sourceUserId: selectedSource._id, targetUserId: targetUser._id, dryRun } });
      const result = data?.MergeAccounts;
      if (!result) {
        throw new Error("Merge did not return a result");
      }
      setLastResult(result);
      flash({ messageString: result.success
        ? (dryRun ? "Dry run completed successfully." : "Accounts merged successfully.")
        : `${dryRun ? "Dry run" : "Merge"} finished with ${result.failures.length} failure${result.failures.length === 1 ? "" : "s"}.` });
      if (!dryRun && result.success) {
        setSelectedSource(null);
        setSearchText('');
      }
    } catch (e) {
      flash({ messageString: e instanceof Error ? e.message : "Failed to merge accounts" });
    } finally {
      setActiveAction(null);
    }
  }, [mutate, selectedSource, targetUser, flash, loading]);

  return (
    <div className={classes.root}>
      <div className={classes.description}>
        Merge another (source) account into this one. The source account's content and karma are transferred
        to this account, and the source account is marked deleted.
      </div>

      {!selectedSource && (
        <div className={classes.comparison}>
          <AccountCard user={targetUser} role="target" />
        </div>
      )}

      <input
        type="text"
        className={classes.searchInput}
        placeholder="Search source account by email, username, slug, display name, or id"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        disabled={loading}
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
              onClick={() => !loading && setSelectedSource(user)}
            >
              <div className={classes.resultName}>{user.displayName}</div>
              <div className={classes.resultMeta}>{formatUser(user)}</div>
            </div>
          ))}
        </div>
      )}

      {selectedSource && (
        <>
          <div className={classes.comparison}>
            <AccountCard user={selectedSource} role="source" />
            <div className={classes.cardArrow}>
              <ForumIcon icon="ArrowRight" />
            </div>
            <AccountCard user={targetUser} role="target" />
          </div>
          <div className={classes.warning}>
            This will merge <strong>{selectedSource.displayName}</strong> (source) into{' '}
            <strong>{targetUser.displayName}</strong> (target, kept). The source account will be deleted after all merge steps succeed.
          </div>
          {activeAction && (
            <div className={classes.status}>
              {activeAction === "dryRun" ? "Dry run in progress..." : "Merge in progress. Keep this tab open until it finishes."}
            </div>
          )}
          {lastResult && lastResult.failures.length > 0 && (
            <div className={classes.failureList}>
              {lastResult.failures.map((failure, i) => (
                <div key={`${failure.stage}-${failure.collectionName ?? ""}-${failure.documentId ?? ""}-${i}`} className={classes.failureItem}>
                  {formatFailure(failure)}
                </div>
              ))}
            </div>
          )}
          <div className={classes.buttonRow}>
            <Button
              variant="outlined"
              className={classes.button}
              onClick={() => runMerge(true)}
              disabled={loading}
            >
              {activeAction === "dryRun" ? "Dry run in progress..." : "Dry run"}
            </Button>
            <Button
              variant="outlined"
              className={classes.dangerButton}
              onClick={() => runMerge(false)}
              disabled={loading}
            >
              {activeAction === "merge" ? "Merge in progress..." : "Merge into this account"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default MergeAccountsSection;
