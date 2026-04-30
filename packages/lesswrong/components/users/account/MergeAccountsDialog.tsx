"use client";
import React, { useCallback, useState } from 'react';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';
import { DialogActions } from '@/components/widgets/DialogActions';
import { DialogContent } from '@/components/widgets/DialogContent';
import { DialogTitle } from '@/components/widgets/DialogTitle';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { Link } from '@/lib/reactRouterWrapper';
import { userGetProfileUrlFromSlug } from '@/lib/collections/users/helpers';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import LWDialog from '../../common/LWDialog';
import UsersSearchAutoComplete from '../../search/UsersSearchAutoComplete';
import FormatDate from '../../common/FormatDate';
import Loading from '../../vulcan-core/Loading';
import ErrorBoundary from '../../common/ErrorBoundary';

const GetMergeCandidateUserQuery = gql(`
  query MergeAccountsDialogGetUser($selector: SelectorInput) {
    user(selector: $selector) {
      result {
        ...UserMergeCandidateInfo
      }
    }
  }
`);

const styles = defineStyles('MergeAccountsDialog', (theme: ThemeType) => ({
  dialogPaper: {
    minWidth: 560,
  },
  intro: {
    fontSize: 13,
    color: theme.palette.grey[700],
    marginBottom: 12,
  },
  targetRow: {
    fontSize: 13,
    color: theme.palette.grey[800],
    marginBottom: 12,
  },
  searchWrapper: {
    marginBottom: 16,
  },
  candidate: {
    border: `1px solid ${theme.palette.greyAlpha(0.15)}`,
    borderRadius: 4,
    padding: '10px 12px',
    marginTop: 12,
  },
  candidateHeader: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  candidateName: {
    fontSize: 15,
    fontWeight: 600,
    color: theme.palette.primary.main,
  },
  candidateSlug: {
    fontSize: 12,
    color: theme.palette.grey[500],
  },
  candidateMeta: {
    fontSize: 13,
    color: theme.palette.grey[700],
    display: 'flex',
    flexWrap: 'wrap',
    gap: 16,
  },
  candidateEmail: {
    fontSize: 13,
    color: theme.palette.grey[700],
    marginTop: 4,
    wordBreak: 'break-all',
  },
  deletedTag: {
    fontSize: 11,
    color: theme.palette.error.main,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  warning: {
    fontSize: 12,
    color: theme.palette.error.main,
    marginTop: 8,
  },
  sameUserWarning: {
    fontSize: 12,
    color: theme.palette.error.main,
    marginTop: 8,
  },
  mergeButton: {
    color: theme.palette.error.main,
    borderColor: theme.palette.error.main,
    textTransform: 'none',
  },
}));

const MergeAccountsDialog = ({ onClose, targetUserId, targetDisplayName, onMerge }: {
  onClose: () => void,
  targetUserId: string,
  targetDisplayName: string | null,
  onMerge: (sourceUserId: string, sourceDisplayName: string) => Promise<void> | void,
}) => {
  const classes = useStyles(styles);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { data, loading } = useQuery(GetMergeCandidateUserQuery, {
    variables: { selector: { _id: selectedUserId ?? '' } },
    skip: !selectedUserId,
  });

  const candidate = data?.user?.result ?? null;

  const handleSelect = useCallback((userId: string) => {
    setSelectedUserId(userId);
  }, []);

  const isSameUser = candidate?._id === targetUserId;

  const onConfirm = useCallback(() => {
    if (!candidate || isSameUser) return;
    void onMerge(candidate._id, candidate.displayName ?? candidate.username ?? candidate._id);
  }, [candidate, isSameUser, onMerge]);

  return (
    <LWDialog open={true} onClose={onClose} maxWidth="md" paperClassName={classes.dialogPaper}>
      <DialogTitle>Merge Account</DialogTitle>
      <DialogContent>
        <div className={classes.intro}>
          Search for a user to merge <b>into</b> the current account. The selected user becomes the source; the current account is the target. All of the source's content (posts, comments, votes, etc.) will be transferred to the target and the source will be marked as deleted.
        </div>
        <div className={classes.targetRow}>
          Target (current account): <b>{targetDisplayName ?? targetUserId}</b>
        </div>
        <div className={classes.searchWrapper}>
          <ErrorBoundary>
            <UsersSearchAutoComplete
              clickAction={handleSelect}
              label="Search for source user"
            />
          </ErrorBoundary>
        </div>

        {selectedUserId && loading && <Loading />}

        {candidate && (
          <div className={classes.candidate}>
            <div className={classes.candidateHeader}>
              <Link
                to={userGetProfileUrlFromSlug(candidate.slug ?? '')}
                target="_blank"
                rel="noopener noreferrer"
                className={classes.candidateName}
              >
                {candidate.displayName ?? candidate.username ?? candidate._id}
              </Link>
              {candidate.slug && <span className={classes.candidateSlug}>@{candidate.slug}</span>}
              {candidate.deleted && <span className={classes.deletedTag}>deleted</span>}
            </div>
            <div className={classes.candidateMeta}>
              <span>Karma: {candidate.karma ?? 0}</span>
              <span>Posts: {candidate.postCount ?? 0}</span>
              <span>Comments: {candidate.commentCount ?? 0}</span>
              <span>
                Created: {candidate.createdAt
                  ? <FormatDate date={candidate.createdAt} />
                  : "unknown"}
              </span>
            </div>
            <div className={classes.candidateEmail}>
              Email: {candidate.email ?? "(none)"}
            </div>
            {isSameUser && (
              <div className={classes.sameUserWarning}>
                This is the same as the target user. Pick a different account.
              </div>
            )}
            {!isSameUser && (
              <div className={classes.warning}>
                Merging is destructive and cannot easily be undone.
              </div>
            )}
          </div>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="outlined"
          className={classes.mergeButton}
          disabled={!candidate || isSameUser}
          onClick={onConfirm}
        >
          Merge
        </Button>
      </DialogActions>
    </LWDialog>
  );
};

export default MergeAccountsDialog;
