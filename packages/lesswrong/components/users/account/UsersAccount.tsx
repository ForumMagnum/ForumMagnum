"use client";
import React from 'react';
import { userCanEditUser } from '@/lib/collections/users/helpers';
import { preferredHeadingCase } from '@/themes/forumTheme';
import { useCurrentUser } from '@/components/common/withUser';
import { hasAccountDeletionFlow } from '@/lib/betas';
import UsersEditForm from "./UsersEditForm";
import UsersAccountManagement from "./UsersAccountManagement";
import ErrorAccessDenied from "../../common/ErrorAccessDenied";
import { useStyles } from '../../hooks/useStyles';
import { defineStyles } from '../../hooks/defineStyles';

const styles = defineStyles("UsersAccount", (theme: ThemeType) => ({
  root: {
    width: "90%",
    maxWidth: 960,
    margin: "auto",
    marginBottom: 100,
    [theme.breakpoints.down('xs')]: {
      width: "100%",
      paddingLeft: 16,
      paddingRight: 16,
    },
  },
  header: {
    paddingTop: theme.isFriendlyUI ? '32px' : '48px',
    paddingBottom: theme.isFriendlyUI ? '16px' : '32px',
    [theme.breakpoints.down('xs')]: {
      paddingTop: 28,
      paddingBottom: 20,
    },
  },
  title: {
    fontSize: 28,
    fontWeight: 400,
    fontFamily: theme.typography.headerStyle?.fontFamily,
    color: theme.palette.grey[900],
    margin: 0,
    letterSpacing: '-0.01em',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.grey[500],
    marginTop: 6,
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

  const accountManagement = hasAccountDeletionFlow()
    ? <UsersAccountManagement terms={terms} />
    : null;

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <h1 className={classes.title}>
          {preferredHeadingCase("Account Settings")}
        </h1>
        <div className={classes.subtitle}>
          Manage your account, profile, and preferences
        </div>
      </div>
      <UsersEditForm terms={terms} accountManagement={accountManagement} />
    </div>
  );
};

export default UsersAccount;
