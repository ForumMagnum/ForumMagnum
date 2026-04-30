"use client";
import React, { useCallback, useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { gql } from '@/lib/generated/gql-codegen';
import { useDialog } from '@/components/common/withDialog';
import { useMessages } from '@/components/common/withMessages';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import MergeAccountsDialog from './MergeAccountsDialog';

const mergeUserAccountsMutation = gql(`
  mutation MergeUserAccounts($sourceUserId: String!, $targetUserId: String!, $dryRun: Boolean) {
    MergeUserAccounts(sourceUserId: $sourceUserId, targetUserId: $targetUserId, dryRun: $dryRun)
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
  button: {
    textTransform: 'none',
  },
}));

const MergeAccountsSection = ({ targetUserId, targetDisplayName }: {
  targetUserId: string,
  targetDisplayName?: string | null,
}) => {
  const classes = useStyles(styles);
  const { openDialog } = useDialog();
  const { flash } = useMessages();
  const [mutate] = useMutation(mergeUserAccountsMutation);
  const [loading, setLoading] = useState(false);

  const performMerge = useCallback(async (sourceUserId: string, sourceDisplayName: string) => {
    if (!confirm(`Merge "${sourceDisplayName}" INTO "${targetDisplayName ?? targetUserId}"? The source account's content will be transferred to the target and the source will be marked as deleted. This cannot easily be undone.`)) {
      return;
    }
    setLoading(true);
    try {
      await mutate({ variables: { sourceUserId, targetUserId, dryRun: false } });
      flash({ messageString: `Merged ${sourceDisplayName} into ${targetDisplayName ?? targetUserId}.` });
    } catch (e: any) {
      flash({ messageString: e.message ?? "Failed to merge accounts" });
    } finally {
      setLoading(false);
    }
  }, [mutate, targetUserId, targetDisplayName, flash]);

  const onClick = useCallback(() => {
    openDialog({
      name: 'MergeAccountsDialog',
      contents: ({ onClose }) => (
        <MergeAccountsDialog
          onClose={onClose}
          targetUserId={targetUserId}
          targetDisplayName={targetDisplayName ?? null}
          onMerge={async (sourceUserId, sourceDisplayName) => {
            onClose();
            await performMerge(sourceUserId, sourceDisplayName);
          }}
        />
      ),
    });
  }, [openDialog, performMerge, targetUserId, targetDisplayName]);

  return (
    <div className={classes.root}>
      <div className={classes.description}>
        Merge another user's account into this one. The source account's posts, comments, votes, etc. will be transferred to this account and the source account will be marked as deleted.
      </div>
      <Button variant="outlined" className={classes.button} onClick={onClick} disabled={loading}>
        {loading ? "Merging..." : "Merge Account Into This User"}
      </Button>
    </div>
  );
};

export default MergeAccountsSection;
