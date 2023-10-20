import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import { useMessages } from '../common/withMessages';
import React from 'react';
import Users from '../../lib/collections/users/collection';
import { getUserEmail, userCanEditUser, userGetDisplayName, userGetProfileUrl} from '../../lib/collections/users/helpers';
import Button from '@material-ui/core/Button';
import { useCurrentUser } from '../common/withUser';
import { useNavigation } from '../../lib/routeUtil';
import { gql, useMutation, useApolloClient } from '@apollo/client';
import { useThemeOptions, useSetTheme } from '../themes/useTheme';
import { captureEvent } from '../../lib/analyticsEvents';
import { configureDatadogRum } from '../../client/datadogRum';
import { preferredHeadingCase } from '../../lib/forumTypeUtils';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    width: "60%",
    maxWidth: 600,
    margin: "auto",
    marginBottom: 100,
    [theme.breakpoints.down('xs')]: {
      width: "100%",
    },
    
    "& .form-input": {
      background: "white",
      borderRadius: 6,
      paddingLeft: "1em",
      paddingRight: "1em",
      paddingTop: "0.5em",
      paddingBottom: "0.5em",
    },

    '& .form-input.form-component-text': {
      paddingTop: "0.7em",
      paddingBottom: "0.7em",
    },
    
    "& .form-section-unicode": {
      padding: 0,
    },
    
    "& .form-submit": {
      marginTop: "3em",
      textAlign: "right",
      
      "& button": {
        paddingLeft: "3em",
        paddingRight: "3em",
      },
    },

    "& .geosuggest__input": {
      border: 0,
      borderBottom: 0,
      color: theme.palette.text.normal,
      fontWeight: 600,
      width: "100%",
    },
    "& .geosuggest__input:focus": {
      borderBottom: 0,
    },

    "& .mui-input-label" : {
      transform: "translate(0,8px) scale(1)",
    },

    "& .mui-input-label[data-shrink='true']" : {
      marginTop: '0.2em',
      transform: 'translate(0,-6px) scale(.75)',
    },
    
    "& .form-input.form-component-text label + .MuiInput-formControl" :{
      marginTop: 0,
    },
    
    "& .MuiInputBase-input" : {
      fontWeight: 600,
      marginTop: "4px",
    },

    "& .input-first_name, & .input-last_name": {
      display: 'inline-block',
      width: '49%',
      marginBottom: "0",
      [theme.breakpoints.down('sm')]: {
        display: 'block',
        width: "100%",
        margin: "16px 0",
      },
    },

    "& .input-last_name": {
      float: "right",
      [theme.breakpoints.down('sm')]: {
        float: "none",
      },
    },

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

const passwordResetMutation = gql`
  mutation resetPassword($email: String) {
    resetPassword(email: $email)
  }
`

const UsersEditForm = ({terms, classes, enableResetPassword = false}: {
  terms: {slug?: string, documentId?: string},
  enableResetPassword?: boolean,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const { flash } = useMessages();
  const { history } = useNavigation();
  const client = useApolloClient();
  const { Typography } = Components;
  const [ mutate, loading ] = useMutation(passwordResetMutation, { errorPolicy: 'all' })
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

  // currentUser will not be the user being edited in the case where current
  // user is an admin. This component does not have access to the user email at
  // all in admin mode unfortunately. In the fullness of time we could fix that,
  // currently we disable it below
  const requestPasswordReset = async () => {
    const { data } = await mutate({variables: { email: getUserEmail(currentUser) }})
    flash(data?.resetPassword)
  } 

  // Since there are two urls from which this component can be rendered, with different terms, we have to
  // check both slug and documentId
  const isCurrentUser = (terms.slug && terms.slug === currentUser?.slug) || (terms.documentId && terms.documentId === currentUser?._id)

  return (
    <div className={classes.root}>
      <Typography variant="display2" className={classes.header}>
        {preferredHeadingCase("Account Settings")}
      </Typography>
      <Typography variant="body2">
        {currentUser?.username}
      </Typography>
      {isCurrentUser && enableResetPassword && <Button
        color="secondary"
        variant="outlined"
        className={classes.resetButton}
        onClick={requestPasswordReset}
      >
        {preferredHeadingCase("Reset Password")}
      </Button>}

      <Components.WrappedSmartForm
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
            history.push(userGetProfileUrl(user))
          }
        }}
        queryFragment={getFragment('UsersEdit')}
        mutationFragment={getFragment('UsersEdit')}
        showRemove={false}
        submitLabel="Save"
      />
    </div>
  );
};


const UsersEditFormComponent = registerComponent('UsersEditForm', UsersEditForm, {styles});

declare global {
  interface ComponentTypes {
    UsersEditForm: typeof UsersEditFormComponent
  }
}
