import React, { useCallback } from 'react';
import { userIsAdminOrMod } from '../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../common/withUser';
import { useMulti } from '../../lib/crud/withMulti';
import { useMessages } from '../common/withMessages';
import { gql, useMutation } from '@apollo/client';
import { registerComponent } from "../../lib/vulcan-lib/components";
import { makeAbsolute } from "../../lib/vulcan-lib/utils";
import ErrorAccessDenied from '../common/ErrorAccessDenied';
import SingleColumnSection from '../common/SingleColumnSection';
import EAButton from '../ea-forum/EAButton';

const styles = (theme: ThemeType) => ({
  root: {
    padding: "24px 36px 60px",
    backgroundColor: theme.palette.background.paper,
    fontFamily: theme.palette.fonts.sansSerifStack
  },
  buttonRow: {
    display: "flex",
    margin: "12px 0",
    gap: "12px"
  }
});

const AdminGoogleServiceAccount = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();

  const { results: serviceAccounts } = useMulti({
    terms: {},
    collectionName: "GoogleServiceAccountSessions",
    fragmentName: 'GoogleServiceAccountSessionAdminInfo',
    enableTotal: false,
  })
  const email = serviceAccounts?.[0]?.email
  const estimatedExpiry = serviceAccounts?.[0]?.estimatedExpiry

  const { flash } = useMessages()

  const [revokeMutation] = useMutation(gql`
    mutation revokeGoogleServiceAccountTokens {
      revokeGoogleServiceAccountTokens
    }
  `,
    {
      onCompleted: () => {
        flash("Successfully revoked access tokens");
      },
      onError: (error) => {
        flash(error.message);
      },
    }
  );

  const handleRevokeClick = useCallback(async () => {
    await revokeMutation()
  }, [revokeMutation]);

  const handleSignInClick = useCallback(async () => {
    window.open(makeAbsolute("/auth/linkgdrive"), "_blank", "noopener,noreferrer");
  }, []);

  if (!userIsAdminOrMod(currentUser)) {
    return <ErrorAccessDenied />
  }

  return (
    <SingleColumnSection className={classes.root}>
      <h1>Google Doc import service account</h1>
      <p>
        This is the account used to fetch google docs when users import them. Even when fetching public docs we still
        need an account to be logged in in order to fetch them. The session will eventually expire so we need to
        periodically log in again.
      </p>
      <p>Email: {email ? email : "—"}</p>
      <p>{`Estimated session expiry: ${estimatedExpiry ? estimatedExpiry : "—"}`}</p>
      <p>
        <b>
          Anyone will be able to download google docs accessible to this account, so make sure you log in to the service
          account you want to use and not your own account!
        </b>
      </p>
      <div className={classes.buttonRow}>
        <EAButton onClick={handleSignInClick}>Sign in/Switch account</EAButton>
        <EAButton onClick={handleRevokeClick}>Revoke all access</EAButton>
      </div>
    </SingleColumnSection>
  );
}

export default registerComponent(
  "AdminGoogleServiceAccount", AdminGoogleServiceAccount, {styles}
);


