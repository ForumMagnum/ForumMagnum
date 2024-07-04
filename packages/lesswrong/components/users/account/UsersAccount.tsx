import { Components, registerComponent } from '@/lib/vulcan-lib';
import React from 'react';
import { useLocation } from '@/lib/routeUtil';
import { userCanEditUser } from '@/lib/collections/users/helpers';
import { preferredHeadingCase } from '@/themes/forumTheme';
import { useCurrentUser } from '@/components/common/withUser';
import { hasAccountDeletionFlow } from '@/lib/betas';

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
    marginLeft: 4,
    marginTop: 32,
    marginBottom: 32,
    marginRight: 16,
  },
})

const UsersAccount = ({ classes }: { classes: ClassesType }) => {
  const { params } = useLocation();
  const currentUser = useCurrentUser();

  const { ErrorAccessDenied, Typography } = Components;

  const terms = { slug: params.slug ?? currentUser?.slug };

  if (!terms.slug || !userCanEditUser(currentUser, terms)) {
    return <ErrorAccessDenied />;
  }

  return (
    <div className={classes.root}>
      <Typography variant="display2" className={classes.header}>
        {preferredHeadingCase("Account Settings")}
      </Typography>
      <Components.UsersEditForm terms={terms} />
      {hasAccountDeletionFlow && (
        <>
          <Typography variant="display2" className={classes.header}>
            {preferredHeadingCase("Manage Account")}
          </Typography>
          <Components.UsersAccountManagement terms={terms} />
        </>
      )}
    </div>
  );
};

const UsersAccountComponent = registerComponent('UsersAccount', UsersAccount, { styles });

declare global {
  interface ComponentTypes {
    UsersAccount: typeof UsersAccountComponent
  }
}


