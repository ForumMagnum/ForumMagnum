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
  terms: {slug: string},
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const { flash } = useMessages();
  const { Typography, ErrorAccessDenied, DummyFormGroup } = Components;


  if(!userCanEditUser(currentUser, terms)) {
    return <ErrorAccessDenied />;
  }
  const isCurrentUser = (terms.slug === currentUser?.slug)

  return (
    <div className={classes.root}>
      <Typography variant="display2" className={classes.header}>
        {preferredHeadingCase("Manage Account")}
      </Typography>
      <DummyFormGroup
        label={"Deactivate account"}
        startCollapsed={true}
      >
        <div>Hello</div>
      </DummyFormGroup>
    </div>
  );
};


const UsersAccountManagementComponent = registerComponent('UsersAccountManagement', UsersAccountManagement, {styles});

declare global {
  interface ComponentTypes {
    UsersAccountManagement: typeof UsersAccountManagementComponent
  }
}
