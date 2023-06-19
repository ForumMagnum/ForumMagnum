import React from 'react';
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { forumSelect } from '../../../lib/forumTypeUtils';
import { autoCommentRateLimits, autoPostRateLimits } from '../../../lib/rateLimits/constants';
import { getRateLimitNames } from '../../../lib/rateLimits/utils';
import { getDownvoteRatio } from '../UsersReviewInfoCard';
import classNames from 'classnames';

const styles = (theme: ThemeType): JssStyles => ({
  postRateLimits: {
    borderBottom: theme.palette.border.faint,
    paddingBottom: 8,
    marginBottom: 8
  }
});

export const recentKarmaTooltip = (user: SunshineUsersList) => {
  return <div>
      <div>{user.recentKarmaInfo.last20Karma} karma from last 20 posts/comments</div>
      <div>{user.recentKarmaInfo.last20PostKarma} karma from the last 20 posts</div>
      <div>{user.recentKarmaInfo.last20CommentKarma} karma from the last 20 comments</div>
      <div>{user.recentKarmaInfo.lastMonthKarma} karma from the last month</div>
    </div>
}

export const downvoterTooltip = (user: SunshineUsersList) => {
  return <div>
    <div>{user.recentKarmaInfo.downvoterCount} downvoters from last 20 posts/comments</div>
    <div>{user.recentKarmaInfo.postDownvoterCount} downvoters on the last 20 posts</div>
    <div>{user.recentKarmaInfo.commentDownvoterCount} 20 downvoters on the last 20 comments</div>
    <div>{user.recentKarmaInfo.lastMonthDownvoterCount} 20 downvoters on the last 20 comments</div>
  </div>
}

export const UserAutoRateLimitsDisplay = ({user, classes}: {
  user: SunshineUsersList,
  classes: ClassesType
}) => {
  const { MetaInfo, LWTooltip } = Components

  const roundedDownvoteRatio = Math.round(getDownvoteRatio(user) * 100)
  const userPostRateLimits = getRateLimitNames(user, forumSelect(autoPostRateLimits))
  const userCommentRateLimits = getRateLimitNames(user, forumSelect(autoCommentRateLimits))
  return <div>
    <div>
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
      <LWTooltip title={recentKarmaTooltip(user)}>
        <MetaInfo className={classNames(classes.info, {[classes.negativeRecentKarma]: user.recentKarmaInfo.last20Karma < 0, [classes.lowRecentKarma]: user.recentKarmaInfo.last20Karma < 5})}>
          {user.recentKarmaInfo.last20Karma} recent karma
        </MetaInfo>
      </LWTooltip>
      <LWTooltip title={downvoterTooltip(user)}>
        <MetaInfo className={classes.info}>
          {user.recentKarmaInfo.downvoterCount} downvoters
        </MetaInfo>
      </LWTooltip>
    </div>
    {userPostRateLimits.length > 0 && <div className={classes.border}>
      {userPostRateLimits.map(rateLimit => <div key={`${user._id}rateLimit`}>
        <MetaInfo>{rateLimit}</MetaInfo>
      </div>)}
    </div>}
    {userPostRateLimits.length > 0 && <div className={classes.border}>
      {userCommentRateLimits.map(rateLimit => <div key={`${user._id}rateLimit`}>
        <MetaInfo>{rateLimit}</MetaInfo>
      </div>)}
    </div>}
  </div>;
}

const UserAutoRateLimitsDisplayComponent = registerComponent('UserAutoRateLimitsDisplay', UserAutoRateLimitsDisplay, {styles});

declare global {
  interface ComponentTypes {
    UserAutoRateLimitsDisplay: typeof UserAutoRateLimitsDisplayComponent
  }
}

