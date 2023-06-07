import React from 'react';
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { getDownvoteRatio } from '../UsersReviewInfoCard';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    paddingTop: 8,
    paddingBottom: 8,
  }
});

export const UserReviewMetadata = ({classes, user}: {
  user: SunshineUsersList
  classes: ClassesType,
}) => {
  const { MetaInfo, FormatDate, LWTooltip } = Components
  const roundedDownvoteRatio = Math.round(getDownvoteRatio(user) * 100)
  return <div className={classes.root}>
    <MetaInfo>
      {user.email}
    </MetaInfo>
    <MetaInfo className={classes.info}>
      <FormatDate date={user.createdAt}/>
    </MetaInfo>
    <MetaInfo className={classes.info}>
      { user.karma || 0 } karma
    </MetaInfo>
    <LWTooltip title={<ul>
      <li>{user.smallUpvoteReceivedCount || 0} Small Upvotes</li>
      <li>{user.bigUpvoteReceivedCount || 0} Big Upvotes</li>
      <li>{user.smallDownvoteReceivedCount || 0} Small Downvotes</li>
      <li>{user.bigDownvoteReceivedCount || 0} Big Downvotes</li>
    </ul>}>
      <MetaInfo className={classes.info}>
        {roundedDownvoteRatio} downvoteRatio
      </MetaInfo>
    </LWTooltip>
    <LWTooltip title={<div>
      <div>{user.recentKarmaInfo.recentKarma} recent overall karma</div>
      <div>{user.recentKarmaInfo.recentPostKarma} recent post karma</div>
      <div>{user.recentKarmaInfo.recentCommentKarma} recent comment karma</div>
    </div>}>
      <MetaInfo className={classes.info}>
        {user.recentKarmaInfo.recentKarma} recent karma
      </MetaInfo>
    </LWTooltip>
    <LWTooltip title={<div>
      <div>{user.recentKarmaInfo.downvoterCount} recent overall downvoters</div>
      <div>{user.recentKarmaInfo.postDownvoterCount} recent post downvoters</div>
      <div>{user.recentKarmaInfo.commentDownvoterCount} recent comment downvoters</div>
    </div>}>
      <MetaInfo className={classes.info}>
        {user.recentKarmaInfo.downvoterCount} downvoters
      </MetaInfo>
    </LWTooltip>
  </div>
}

const UserReviewMetadataComponent = registerComponent('UserReviewMetadata', UserReviewMetadata, {styles});

declare global {
  interface ComponentTypes {
    UserReviewMetadata: typeof UserReviewMetadataComponent
  }
}

