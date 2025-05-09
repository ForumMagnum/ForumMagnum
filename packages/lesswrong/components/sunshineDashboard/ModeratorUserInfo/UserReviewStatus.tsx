import React from 'react';
import { Link } from '../../../lib/reactRouterWrapper';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { FormatDate } from "../../common/FormatDate";
import { UsersNameWrapper } from "../../users/UsersNameWrapper";
import { AltAccountInfo } from "./AltAccountInfo";

const styles = (_theme: ThemeType) => ({
  root: {
    marginTop: 16,
    fontStyle: "italic",
    wordBreak: "break-all"
  },
  accountFlag: {
  },
  qualitySignalRow: {
    maxHeight: 20,
    overflow: "hidden"
  }
});

export const UserReviewStatusInner = ({classes, user}: {
  classes: ClassesType<typeof styles>,
  user: SunshineUsersList
}) => {
  const approvalStatus = user.banned 
    ? "Banned"
    : (user.reviewedByUserId && user.snoozedUntilContentCount) ? `Snoozed, ${user.snoozedUntilContentCount}` : "Approved"

  const firstClientId = user.associatedClientIds?.[0];
  return <div className={classes.root}>
    {(user.reviewedByUserId && user.reviewedAt)
      ? <div>Reviewed <FormatDate date={user.reviewedAt}/> ago by <UsersNameWrapper documentId={user.reviewedByUserId}/> ({approvalStatus})</div>
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
    {user.nullifyVotes && <div className={classes.accountFlag}>Previous votes deleted</div>}
    {user.deleteContent && <div className={classes.accountFlag}>Content purged</div>}

    {firstClientId?.firstSeenReferrer && <div className={classes.qualitySignalRow}>Initial referrer: <a href={firstClientId?.firstSeenReferrer}>{firstClientId?.firstSeenReferrer}</a></div>}
    {firstClientId?.firstSeenLandingPage && <div className={classes.qualitySignalRow}>Initial landing page: <Link to={firstClientId?.firstSeenLandingPage}>{firstClientId?.firstSeenLandingPage}</Link></div>}
    {user.altAccountsDetected && <AltAccountInfo user={user}/>}
    <div className={classes.qualitySignalRow}>ReCaptcha Rating: {user.signUpReCaptchaRating || "no rating"}</div>
  </div>;
}

export const UserReviewStatus = registerComponent('UserReviewStatus', UserReviewStatusInner, {styles});


