import { useMessages } from '@/components/common/withMessages';
import React from 'react';
import { getUserEmail, userCanEditUser, userGetDisplayName, userGetProfileUrl} from '@/lib/collections/users/helpers';
import Button from '@material-ui/core/Button';
import { useCurrentUser } from '@/components/common/withUser';
import { gql, useMutation, useApolloClient } from '@apollo/client';
import { isEAForum } from '@/lib/instanceSettings';
import { useThemeOptions, useSetTheme } from '@/components/themes/useTheme';
import { captureEvent } from '@/lib/analyticsEvents';
import { configureDatadogRum } from '@/client/datadogRum';
import { isFriendlyUI, preferredHeadingCase } from '@/themes/forumTheme';
import { useNavigate } from '@/lib/routeUtil.tsx';
import { Components, registerComponent } from "@/lib/vulcan-lib/components.tsx";

const styles = (theme: ThemeType) => ({
  root: {
    ...(isFriendlyUI && {
      "& .form-submit": {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        marginRight: 5,
      },
    }),
  },
  resetButton: {
    marginBottom:theme.spacing.unit * 4
  },
})

const UsersEditForm = ({terms, classes}: {
  terms: {slug: string},
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const { flash } = useMessages();
  const navigate = useNavigate();
  const client = useApolloClient();
  const { ErrorAccessDenied } = Components;
  const [ mutate, loading ] = useMutation(gql`
    mutation resetPassword($email: String) {
      resetPassword(email: $email)
    }
  `, { errorPolicy: 'all' })
  const currentThemeOptions = useThemeOptions();
  const setTheme = useSetTheme();

  if(!userCanEditUser(currentUser, terms)) {
    return <ErrorAccessDenied />;
  }
  const isCurrentUser = (terms.slug === currentUser?.slug)

  // currentUser will not be the user being edited in the case where current
  // user is an admin. This component does not have access to the user email at
  // all in admin mode unfortunately. In the fullness of time we could fix that,
  // currently we disable it below
  const requestPasswordReset = async () => {
    const { data } = await mutate({variables: { email: getUserEmail(currentUser) }})
    flash(data?.resetPassword)
  }

  return (
    <div className={classes.root}>
      {/* TODO(EA): Need to add a management API call to get the reset password
          link, but for now users can reset their password from the login
          screen */}
      {isCurrentUser && !isEAForum && <Button
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
            navigate(userGetProfileUrl(user))
          }
        }}
        queryFragmentName={'UsersEdit'}
        mutationFragmentName={'UsersEdit'}
        showRemove={false}
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
