import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import { useMessages } from '../common/withMessages';
import React from 'react';
import { getUserEmail, userCanEditUser, userGetDisplayName, userGetProfileUrl} from '../../lib/collections/users/helpers';
import Button from '@material-ui/core/Button';
import { useCurrentUser } from '../common/withUser';
import { gql, useMutation, useApolloClient } from '@apollo/client';
import { useThemeOptions, useSetTheme } from '../themes/useTheme';
import { captureEvent } from '../../lib/analyticsEvents';
import { configureDatadogRum } from '../../client/datadogRum';
import { preferredHeadingCase } from '../../themes/forumTheme';
import { useNavigate } from '../../lib/reactRouterWrapper';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    width: "60%",
    maxWidth: 600,
    margin: "auto",
    marginBottom: 100,
    [theme.breakpoints.down('xs')]: {
      width: "100%",
    }
  },

  header: {
    margin: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 4,
    [theme.breakpoints.down('md')]: {
      marginLeft: theme.spacing.unit/2,
    },
  },
  resetButton: {
    marginBottom:theme.spacing.unit * 4
  }
})

const UsersAccountManagement = ({terms, classes}: {
  terms: {slug?: string, documentId?: string},
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const { flash } = useMessages();
  const navigate = useNavigate();
  const client = useApolloClient();
  const { Typography, FormGroupLayout } = Components;
  const currentThemeOptions = useThemeOptions();
  const setTheme = useSetTheme();

  if(!terms.slug && !terms.documentId) {
    // No user specified and not logged in
    return (
      <div className={classes.root}>
        Log in to edit your profile.
      </div>
    );
  }
  if (!userCanEditUser(currentUser,
    terms.documentId ?
      {_id: terms.documentId} :
      // HasSlugType wants some fields we don't have (schemaVersion, _id), but
      // userCanEdit won't use them
      {slug: terms.slug, __collectionName: 'Users'} as HasSlugType
  )) {
    return <span>Sorry, you do not have permission to do this at this time.</span>
  }

  // Since there are two urls from which this component can be rendered, with different terms, we have to
  // check both slug and documentId
  const isCurrentUser = (terms.slug && terms.slug === currentUser?.slug) || (terms.documentId && terms.documentId === currentUser?._id)

  if (!isCurrentUser) {
    throw new Error("Not implemented")
  }

  return (
    <div className={classes.root}>
      <Typography variant="display2" className={classes.header}>
        {preferredHeadingCase("Manage Account")}
      </Typography>

      {/* <Components.WrappedSmartForm
        collectionName="Users"
        {...terms}
        removeFields={currentUser?.isAdmin ? [] : ["paymentEmail", "paymentInfo"]}
        successCallback={async (user: AnyBecauseTodo) => {
          if (user?.theme) {
            const theme = {...currentThemeOptions, ...user.theme};
            setTheme(theme);
            captureEvent("setUserTheme", theme);
          }

          // reconfigure datadog RUM in case they have changed their settings
          configureDatadogRum(user)

          flash(`User "${userGetDisplayName(user)}" edited`);
          try {
            await client.resetStore()
          } finally {
            navigate(userGetProfileUrl(user))
          }
        }}
        queryFragment={getFragment('UsersEdit')}
        mutationFragment={getFragment('UsersEdit')}
        showRemove={false}
      /> */}
    </div>
  );
};


const UsersAccountManagementComponent = registerComponent('UsersAccountManagement', UsersAccountManagement, {styles});

declare global {
  interface ComponentTypes {
    UsersAccountManagement: typeof UsersAccountManagementComponent
  }
}
