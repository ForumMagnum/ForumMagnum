import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import MetaInfo from "../../common/MetaInfo";
import FormatDate from "../../common/FormatDate";
import { getReasonForReview } from '@/lib/collections/moderatorActions/helpers';

const styles = (theme: ThemeType) => ({
  root: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  lowRecentKarma: {
    color: theme.palette.warning
  },
  negativeRecentKarma: {
    color: theme.palette.error.dark
  }
});

export const UserReviewMetadata = ({classes, user}: {
  user: SunshineUsersList
  classes: ClassesType<typeof styles>,
}) => {
  const {needsReview, reason: reviewReason} = getReasonForReview(user)

  return <div className={classes.root}>
    <MetaInfo>
      {user.email}
    </MetaInfo>
    <MetaInfo>
      <FormatDate date={user.createdAt}/>
    </MetaInfo>
    <MetaInfo>
      { user.karma || 0 } karma
    </MetaInfo>
    {needsReview && (
      <MetaInfo>
        Reason:&nbsp;{reviewReason}
      </MetaInfo>
    )}
  </div>
}

export default registerComponent('UserReviewMetadata', UserReviewMetadata, {styles});



