import React, { useState } from 'react';
import { registerComponent, Components } from '../../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginTop: 16,
    fontStyle: "italic"
  }
});

export const UserReviewStatus = ({classes, user}: {
  classes: ClassesType,
  user: SunshineUsersList
}) => {
  const { FormatDate, UsersNameWrapper } = Components

  const [showAlternateAccounts, setShowAlternateAccounts] = useState<boolean>(false)

  const approvalStatus = user.banned 
    ? "Banned"
    : (user.reviewedByUserId && user.snoozedUntilContentCount) ? `Snoozed, ${user.snoozedUntilContentCount}` : "Approved"

  return <div className={classes.root}>
    {user.reviewedAt
      ? <div className={classes.reviewedAt}>Reviewed <FormatDate date={user.reviewedAt}/> ago by <UsersNameWrapper documentId={user.reviewedByUserId}/> ({approvalStatus})</div>
      : null 
    }
    {user.banned
      ? <p><em>Banned until <FormatDate date={user.banned}/></em></p>
      : null 
    }
    {user.associatedClientId?.firstSeenReferrer && <div className={classes.qualitySignalRow}>Initial referrer: {user.associatedClientId?.firstSeenReferrer}</div>}
    {user.associatedClientId?.firstSeenLandingPage && <div className={classes.qualitySignalRow}>Initial landing page: {user.associatedClientId?.firstSeenLandingPage}</div>}
    {(user.associatedClientId?.userIds?.length??0) > 1 && <div className={classes.qualitySignalRow}>
      <a onClick={() => setShowAlternateAccounts(true)}><em>Alternate accounts detected ({user.associatedClientId?.userIds?.length})</em></a>
      {showAlternateAccounts && <ul>
        {user.associatedClientId?.userIds.map(userId => <li key={userId}><UsersNameWrapper documentId={userId}/> {userId}</li>)}
      </ul>}
    </div>}
    <div className={classes.qualitySignalRow}>ReCaptcha Rating: {user.signUpReCaptchaRating || "no rating"}</div>
  </div>;
}

const UserReviewStatusComponent = registerComponent('UserReviewStatus', UserReviewStatus, {styles});

declare global {
  interface ComponentTypes {
    UserReviewStatus: typeof UserReviewStatusComponent
  }
}
