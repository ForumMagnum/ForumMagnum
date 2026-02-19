"use client";
import React from 'react';
import { useLocation } from '@/lib/routeUtil';
import { userCanEditUser } from '@/lib/collections/users/helpers';
import { preferredHeadingCase } from '@/themes/forumTheme';
import { useCurrentUser } from '@/components/common/withUser';
import { hasAccountDeletionFlow } from '@/lib/betas';
import UsersEditForm from "./UsersEditForm";
import UsersAccountManagement from "./UsersAccountManagement";
import ErrorAccessDenied from "../../common/ErrorAccessDenied";
import { Typography } from "../../common/Typography";
import { useStyles } from '../../hooks/useStyles';
import { defineStyles } from '../../hooks/defineStyles';

const styles = defineStyles("UsersAccount", (theme: ThemeType) => ({
  root: {
    width: "60%",
    maxWidth: 600,
    margin: "auto",
    marginBottom: 100,
    [theme.breakpoints.down('xs')]: {
      width: "100%",
    },
  },
  header: {
    margin: 0,
    paddingTop: theme.isFriendlyUI ? '32px' : '16px',
    paddingBottom: theme.isFriendlyUI ? '16px' : '32px',
    paddingLeft: theme.isFriendlyUI ? '4px' : '16px',
    paddingRight: '16px',
    [theme.breakpoints.down('xs')]: {
      paddingLeft: "4px",
    },
  },
}))

const UsersAccount = ({slug}: {slug: string|null}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const slugWithFallback = slug ?? currentUser?.slug;

  if (!slugWithFallback || !userCanEditUser(currentUser, {slug: slugWithFallback})) {
    return <ErrorAccessDenied />;
  }

  const terms = { slug: slugWithFallback };
  return (
    <div className={classes.root}>
      <Typography variant="display2" className={classes.header}>
        {preferredHeadingCase("Account Settings")}
      </Typography>
      <UsersEditForm terms={terms} />
      {hasAccountDeletionFlow() && (
        <>
          <Typography variant="display2" className={classes.header}>
            {preferredHeadingCase("Manage Account")}
          </Typography>
          <UsersAccountManagement terms={terms} />
        </>
      )}
    </div>
  );
};

export default UsersAccount;
