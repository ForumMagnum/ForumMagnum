"use client";

import { registerComponent } from '@/lib/vulcan-lib/components';
import React from 'react';
import { useLocation } from '@/lib/routeUtil';
import { userCanEditUser } from '@/lib/collections/users/helpers';
import { isFriendlyUI, preferredHeadingCase } from '@/themes/forumTheme';
import { useCurrentUser } from '@/components/common/withUser';
import { hasAccountDeletionFlow } from '@/lib/betas';
import UsersEditForm from "./UsersEditForm";
import UsersAccountManagement from "./UsersAccountManagement";
import ErrorAccessDenied from "../../common/ErrorAccessDenied";
import { Typography } from "../../common/Typography";

const styles = (theme: ThemeType) => ({
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
    paddingTop: isFriendlyUI ? '32px' : '16px',
    paddingBottom: isFriendlyUI ? '16px' : '32px',
    paddingLeft: isFriendlyUI ? '4px' : '16px',
    paddingRight: '16px',
    [theme.breakpoints.down('xs')]: {
      paddingLeft: "4px",
    },
  },
})

const UsersAccount = ({ classes }: { classes: ClassesType<typeof styles> }) => {
  const { params } = useLocation();
  const currentUser = useCurrentUser();
  const terms = { slug: params.slug ?? currentUser?.slug };

  if (!terms.slug || !userCanEditUser(currentUser, terms)) {
    return <ErrorAccessDenied />;
  }

  return (
    <div className={classes.root}>
      <Typography variant="display2" className={classes.header}>
        {preferredHeadingCase("Account Settings")}
      </Typography>
      <UsersEditForm terms={terms} />
      {hasAccountDeletionFlow && (
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

export default registerComponent('UsersAccount', UsersAccount, { styles });




