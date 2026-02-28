"use client";
import React, { useCallback, useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { gql } from '@/lib/generated/gql-codegen';
import { useMessages } from '@/components/common/withMessages';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const softDeleteUserMutation = gql(`
  mutation SoftDeleteUser($userId: String!) {
    SoftDeleteUser(userId: $userId)
  }
`);

const styles = defineStyles('SoftDeleteUserSection', (theme: ThemeType) => ({
  root: {
    padding: '12px 0',
  },
  description: {
    fontSize: 13,
    color: theme.palette.grey[600],
    marginBottom: 8,
  },
  button: {
    color: theme.palette.error.main,
    borderColor: theme.palette.error.main,
    textTransform: 'none',
  },
}));

const SoftDeleteUserSection = ({ userId }: { userId: string }) => {
  const classes = useStyles(styles);
  const { flash } = useMessages();
  const [mutate] = useMutation(softDeleteUserMutation);
  const [loading, setLoading] = useState(false);
  const onClick = useCallback(async () => {
    if (!confirm("This will replace the user's username, display name, slug, email, and bio with a deleted marker, clear their auth services, and mark them as deleted. They will not be able to log in. This cannot be easily undone. Continue?")) {
      return;
    }
    setLoading(true);
    try {
      await mutate({ variables: { userId } });
      flash({ messageString: "User has been soft-deleted." });
    } catch (e: any) {
      flash({ messageString: e.message ?? "Failed to soft-delete user" });
    } finally {
      setLoading(false);
    }
  }, [mutate, userId, flash]);
  return (
    <div className={classes.root}>
      <div className={classes.description}>
        Replace PII with a "deleted-DATE" marker and clear auth. User will be unable to log in.
      </div>
      <Button variant="outlined" className={classes.button} onClick={onClick} disabled={loading}>
        {loading ? "Deleting..." : "Soft Delete User"}
      </Button>
    </div>
  );
};

export default SoftDeleteUserSection;
