"use client";

import React, { useCallback } from 'react';
import { userIsAdminOrMod } from '../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../common/withUser';
import { useMessages } from '../common/withMessages';
import { useMutation } from "@apollo/client/react";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { makeAbsolute } from "../../lib/vulcan-lib/utils";
import ErrorAccessDenied from '../common/ErrorAccessDenied';
import SingleColumnSection from '../common/SingleColumnSection';
import EAButton from '../ea-forum/EAButton';

const GoogleServiceAccountSessionAdminInfoMultiQuery = gql(`
  query multiGoogleServiceAccountSessionAdminGoogleServiceAccountQuery($selector: GoogleServiceAccountSessionSelector, $limit: Int, $enableTotal: Boolean) {
    googleServiceAccountSessions(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...GoogleServiceAccountSessionAdminInfo
      }
      totalCount
    }
  }
`);

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

  const { data } = useQuery(GoogleServiceAccountSessionAdminInfoMultiQuery, {
    variables: {
      selector: { default: {} },
      limit: 10,
      enableTotal: false,
    },
    notifyOnNetworkStatusChange: true,
  });

  const serviceAccounts = data?.googleServiceAccountSessions?.results;
  const email = serviceAccounts?.[0]?.email
  const estimatedExpiry = serviceAccounts?.[0]?.estimatedExpiry

  const { flash } = useMessages()

  const [revokeMutation] = useMutation(gql(`
    mutation revokeGoogleServiceAccountTokens {
      revokeGoogleServiceAccountTokens
    }
  `),
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


