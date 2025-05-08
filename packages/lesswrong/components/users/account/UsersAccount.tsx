import { Components, registerComponent } from '@/lib/vulcan-lib/components.tsx';
import React from 'react';
import { useLocation } from '@/lib/routeUtil';
import { userCanEditUser } from '@/lib/collections/users/helpers';
import { isFriendlyUI, preferredHeadingCase } from '@/themes/forumTheme';
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

const UsersAccountInner = ({ classes }: { classes: ClassesType<typeof styles> }) => {
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

export const UsersAccount = registerComponent('UsersAccount', UsersAccountInner, { styles });

declare global {
  interface ComponentTypes {
    UsersAccount: typeof UsersAccount
  }
}


