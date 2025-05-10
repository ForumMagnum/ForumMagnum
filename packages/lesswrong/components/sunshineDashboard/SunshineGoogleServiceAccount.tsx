import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useMulti } from '../../lib/crud/withMulti';
import { useCurrentUser } from '../common/withUser';
import { Link } from '../../lib/reactRouterWrapper';
import { userIsAdmin } from '../../lib/vulcan-users/permissions';
import { hasGoogleDocImportSetting } from '../../lib/publicSettings';

const styles = (theme: ThemeType) => ({
  root: {
    padding: 12,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontWeight: 500,
    color: theme.palette.warning.main
  }
});

const WARN_THRESHOLD = 28 * 24 * 60 * 60 * 1000; // 28 days in milliseconds

const NO_ACCOUNT_MESSAGE = "Set up a service account to allow users to import Google Docs. An error message will show in the post editor until you do this"
const getExpiryMessage = (estimatedExpiry: Date) => {
  return `The session for the service account used to handle Google Doc imports will expire soon (${estimatedExpiry} estimated), log in again to ensure the feature keeps working`
}

const SunshineGoogleServiceAccountInner = ({ classes }: {
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();

  const { results: serviceAccounts, loading } = useMulti({
    terms: {},
    collectionName: "GoogleServiceAccountSessions",
    fragmentName: 'GoogleServiceAccountSessionAdminInfo',
    enableTotal: false,
    skip: !hasGoogleDocImportSetting.get(),
  })
  const estimatedExpiry = serviceAccounts?.[0]?.estimatedExpiry

  const shouldWarn = !estimatedExpiry || (new Date(estimatedExpiry).getTime() - Date.now()) < WARN_THRESHOLD

  if (loading || !userIsAdmin(currentUser) || !hasGoogleDocImportSetting.get() || !shouldWarn) {
    return null;
  }

  const message = estimatedExpiry ? getExpiryMessage(estimatedExpiry) : NO_ACCOUNT_MESSAGE

  return (
    <div className={classes.root}>
      <Link to={"/admin/googleServiceAccount"}>
        {message}
      </Link>
    </div>
  )
}

export const SunshineGoogleServiceAccount = registerComponent('SunshineGoogleServiceAccount', SunshineGoogleServiceAccountInner, {styles})


