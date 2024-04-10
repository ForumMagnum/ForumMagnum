import React from 'react';
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { forumSelect } from '../../../lib/forumTypeUtils';
import { autoCommentRateLimits, autoPostRateLimits } from '../../../lib/rateLimits/constants';
import { getActiveRateLimitNames, getStrictestActiveRateLimitNames as getStrictestActiveRateLimits } from '../../../lib/rateLimits/utils';
import { getDownvoteRatio } from '../UsersReviewInfoCard';
import classNames from 'classnames';
import StarIcon from '@material-ui/icons/Star';
import StarBorderIcon from '@material-ui/icons/StarBorder';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

const styles = (theme: ThemeType): JssStyles => ({
  padding: {
    marginTop: 8,
  },
  icon: {
    height: 16,
    width: 16,
    color: theme.palette.grey[500],
    position: "relative",
    top: 2,
    marginRight: 5
  }, 
  downvoteIcon: {
    height: 24,
    width: 24,
    color: theme.palette.grey[700],
    position: "relative",
    top: 7
  },
  percentIcon: {
    height: 15,
    fontWeight: 600,
    marginRight: 5
  },
  info: {
    marginRight: 16
  }
});

export const recentKarmaTooltip = (user: SunshineUsersList) => {
  return <div>
      <div>Recent Karma</div>
      <div><em>{user.recentKarmaInfo.last20Karma} karma from last 20 posts/comments</em></div>
      <div><em>{user.recentKarmaInfo.last20PostKarma} karma from last 20 posts</em></div>
      <div><em>{user.recentKarmaInfo.last20CommentKarma} karma from last 20 comments</em></div>
      <div><em>{user.recentKarmaInfo.lastMonthKarma} karma from last month</em></div>
    </div>
}

export const downvoterTooltip = (user: SunshineUsersList) => {
  return <div>
    <div>Recent Downvoters</div>
    <div><em>{user.recentKarmaInfo.downvoterCount} downvoters from last 20 posts/comments</em></div>
    <div><em>{user.recentKarmaInfo.lastMonthDownvoterCount} downvoters in the last month</em></div>
    <div><em>{user.recentKarmaInfo.postDownvoterCount} downvoters on last 20 posts</em></div>
    <div><em>{user.recentKarmaInfo.commentDownvoterCount} downvoters on last 20 comments</em></div>
  </div>
}

export const UserAutoRateLimitsDisplay = ({user, showKarmaMeta=false, classes}: {
  user: SunshineUsersList,
  classes: ClassesType,
  showKarmaMeta?: boolean
}) => {
  const { MetaInfo, LWTooltip } = Components

  const roundedDownvoteRatio = Math.round(getDownvoteRatio(user) * 100)
  const allRateLimits = [...forumSelect(autoPostRateLimits), ...forumSelect(autoCommentRateLimits)]
  const strictestRateLimits = getStrictestActiveRateLimits(user, allRateLimits);
  const allActiveRateLimitsNames = getActiveRateLimitNames(user, allRateLimits);
  const nonStrictestRateLimitsNames = allActiveRateLimitsNames.filter(rateLimitName => !strictestRateLimits.some(strictLimit => strictLimit.name === rateLimitName))

  return <div>
    {showKarmaMeta && <div>
      <LWTooltip title="total karma">
        <MetaInfo className={classes.info}>
          <StarIcon className={classes.icon}/>{ user.karma || 0 }
        </MetaInfo>
      </LWTooltip>
      <LWTooltip title={recentKarmaTooltip(user)}>
        <MetaInfo className={classNames(classes.info, {[classes.negativeRecentKarma]: user.recentKarmaInfo.last20Karma < 0, [classes.lowRecentKarma]: user.recentKarmaInfo.last20Karma < 5})}>
          <StarBorderIcon className={classes.icon}/>{user.recentKarmaInfo.last20karma}
        </MetaInfo>
      </LWTooltip>
      <LWTooltip title={downvoterTooltip(user)}>
        <MetaInfo className={classes.info}>
          <ExpandMoreIcon className={classes.downvoteIcon}/> {user.recentKarmaInfo.downvoterCount ?? 0}
        </MetaInfo>
      </LWTooltip>
      <LWTooltip title={<div><div>Total Downvote Ratio {roundedDownvoteRatio}</div>
        <li>{user.smallUpvoteReceivedCount || 0} Small Upvotes</li>
        <li>{user.bigUpvoteReceivedCount || 0} Big Upvotes</li>
        <li>{user.smallDownvoteReceivedCount || 0} Small Downvotes</li>
        <li>{user.bigDownvoteReceivedCount || 0} Big Downvotes</li>
      </div>}>
        <MetaInfo className={classes.info}>
          <span className={classes.percentIcon}>%</span> {roundedDownvoteRatio}
        </MetaInfo>
      </LWTooltip>
    </div>}
    {strictestRateLimits.map(({name, isActive}) => <div key={`${user._id}rateLimitstrict${name}`}>
      <LWTooltip title={`Calculated via: ${isActive.toString()}`}><MetaInfo>{name}</MetaInfo></LWTooltip>
    </div>)}
    {nonStrictestRateLimitsNames.length > 0 && <LWTooltip title={<div>
      {nonStrictestRateLimitsNames.map(rateLimit => <div key={`${user._id}rateLimit${rateLimit}`}>{rateLimit}</div>)}</div>}>
      <MetaInfo>{nonStrictestRateLimitsNames.length} More</MetaInfo>
    </LWTooltip>}
  </div>;
}

const UserAutoRateLimitsDisplayComponent = registerComponent('UserAutoRateLimitsDisplay', UserAutoRateLimitsDisplay, {styles});

declare global {
  interface ComponentTypes {
    UserAutoRateLimitsDisplay: typeof UserAutoRateLimitsDisplayComponent
  }
}
