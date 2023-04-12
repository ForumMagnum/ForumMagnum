import React from 'react';
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { Link } from '../../../lib/reactRouterWrapper'

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginTop: 16,
    fontStyle: "italic"
  },
  accountFlag: {
  },
});

export const UserReviewStatus = ({classes, user}: {
  classes: ClassesType,
  user: SunshineUsersList
}) => {
  const { FormatDate, UsersNameWrapper } = Components

  const approvalStatus = user.banned 
    ? "Banned"
    : (user.reviewedByUserId && user.snoozedUntilContentCount) ? `Snoozed, ${user.snoozedUntilContentCount}` : "Approved"

  const firstClientId = user.associatedClientIds?.[0];
  return <div className={classes.root}>
    {(user.reviewedByUserId && user.reviewedAt)
      ? <div className={classes.reviewedAt}>Reviewed <FormatDate date={user.reviewedAt}/> ago by <UsersNameWrapper documentId={user.reviewedByUserId}/> ({approvalStatus})</div>
      : null 
    }
    {user.banned
      ? <p><em>Banned until <FormatDate format="YYYY-MM-DD" date={user.banned}/></em></p>
      : null 
    }

    {user.allCommentingDisabled && <div className={classes.accountFlag}>All commenting disabled</div>}
    {user.commentingOnOtherUsersDisabled && <div className={classes.accountFlag}>Commenting on other users disabled</div>}
    {user.conversationsDisabled && <div className={classes.accountFlag}>Private messaging disabled</div>}
    {user.postingDisabled && <div className={classes.accountFlag}>Posting disabled</div>}
    {user.voteBanned && <div className={classes.accountFlag}>Banned from voting</div>}
    {user.nullifyVotes && <div className={classes.accountFlag}>Previous votes deleted</div>}
    {user.deleteContent && <div className={classes.accountFlag}>Content purged</div>}

    {firstClientId?.firstSeenReferrer && <div className={classes.qualitySignalRow}>Initial referrer: {firstClientId?.firstSeenReferrer}</div>}
    {firstClientId?.firstSeenLandingPage && <div className={classes.qualitySignalRow}>Initial landing page: {firstClientId?.firstSeenLandingPage}</div>}
    {(firstClientId?.userIds?.length??0) > 1 && <div className={classes.qualitySignalRow}>
      <em><Link to={`/moderation/altAccounts?slug=${user.slug}`}>Alternate accounts detected</Link></em>
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
