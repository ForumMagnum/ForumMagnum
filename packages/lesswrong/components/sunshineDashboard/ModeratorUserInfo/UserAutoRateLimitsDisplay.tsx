import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { forumSelect } from '../../../lib/forumTypeUtils';
import { autoCommentRateLimits, autoPostRateLimits } from '../../../lib/rateLimits/constants';
import { getActiveRateLimitNames, getDownvoteRatio, getStrictestActiveRateLimitNames as getStrictestActiveRateLimits } from '../../../lib/rateLimits/utils';
import StarIcon from '@/lib/vendor/@material-ui/icons/src/Star';
import StarBorderIcon from '@/lib/vendor/@material-ui/icons/src/StarBorder';
import MetaInfo from "../../common/MetaInfo";
import LWTooltip from "../../common/LWTooltip";
import ForumIcon from '@/components/common/ForumIcon';
import classNames from 'classnames';

const styles = (theme: ThemeType) => ({
  root: {
    width: 'fit-content',
  },
  padding: {
    marginTop: 8,
  },
  karmaMeta: {
    display: "flex",
    alignItems: "center",
  },
  karmaMetaItem: {
    height: 24,
    width: 36,
    display: "flex",
    alignItems: "center",
  },
  icon: {
    height: 16,
    width: 16,
    color: theme.palette.grey[500],
    position: "relative",
    top: 2,
    marginRight: 4
  }, 
  downvoteIcon: {
    height: 20,
    width: 20,
    color: theme.palette.grey[700],
    top: 4,
    position: 'unset',
    marginRight: 0,
  },
  percentIcon: {
    height: 15,
    width: 15,
    fontWeight: 600,
    display: 'flex',
    justifyContent: 'center',
    marginRight: 2,
  },
  info: {
    marginRight: 16,
    height: 20,
    display: "flex",
  },
  strictestRateLimits: {
    margin: 0,
  },
  absoluteRoot: {
    position: 'relative',
  },
  absolute: {
    position: 'absolute',
    top: 20,
    left: -36,
    width: 'max-content',
    listStyleType: 'none',
  },
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

export const UserAutoRateLimitsDisplay = ({user, showKarmaMeta=false, absolute, classes}: {
  user: SunshineUsersList,
  classes: ClassesType<typeof styles>,
  showKarmaMeta?: boolean,
  absolute?: boolean
}) => {
  const roundedDownvoteRatio = Math.round(getDownvoteRatio(user) * 100)
  const allRateLimits = [...forumSelect(autoPostRateLimits), ...forumSelect(autoCommentRateLimits)]
  const strictestRateLimits = getStrictestActiveRateLimits(user, allRateLimits);
  const allActiveRateLimitsNames = getActiveRateLimitNames(user, allRateLimits);
  const nonStrictestRateLimitsNames = allActiveRateLimitsNames.filter(rateLimitName => !strictestRateLimits.some(strictLimit => strictLimit.name === rateLimitName))

  const totalReceivedVotes = (
    (user.smallUpvoteReceivedCount ?? 0) +
    (user.bigUpvoteReceivedCount ?? 0) +
    (user.smallDownvoteReceivedCount ?? 0) +
    (user.bigDownvoteReceivedCount ?? 0)
  );

  return <div className={classNames(classes.root, absolute && classes.absoluteRoot)}>
    {showKarmaMeta && <div className={classes.karmaMeta}>
      <LWTooltip title="total karma" className={classes.karmaMetaItem}>
        <MetaInfo className={classes.info}>
          <StarIcon className={classes.icon}/>{ user.karma || 0 }
        </MetaInfo>
      </LWTooltip>
      {totalReceivedVotes > 0 && <LWTooltip title={recentKarmaTooltip(user)} className={classes.karmaMetaItem}>
        <MetaInfo className={classes.info}>
          <StarBorderIcon className={classes.icon}/>{user.recentKarmaInfo.last20karma}
        </MetaInfo>
      </LWTooltip>}
      <LWTooltip title={downvoterTooltip(user)} className={classes.karmaMetaItem}>
        <MetaInfo className={classNames(classes.info, classes.karmaMetaItem)}>
          <ForumIcon icon="ExpandMore" className={classNames(classes.icon, classes.downvoteIcon)}/> {user.recentKarmaInfo.downvoterCount ?? 0}
        </MetaInfo>
      </LWTooltip>
      <LWTooltip title={<div><div>Total Downvote Ratio {roundedDownvoteRatio}</div>
        <li>{user.smallUpvoteReceivedCount || 0} Small Upvotes</li>
        <li>{user.bigUpvoteReceivedCount || 0} Big Upvotes</li>
        <li>{user.smallDownvoteReceivedCount || 0} Small Downvotes</li>
        <li>{user.bigDownvoteReceivedCount || 0} Big Downvotes</li>
      </div>} className={classes.karmaMetaItem}>
        <MetaInfo className={classes.info}>
          <span className={classes.percentIcon}>%</span> {roundedDownvoteRatio}
        </MetaInfo>
      </LWTooltip>
    </div>}
    <ul className={classNames(classes.strictestRateLimits, absolute && classes.absolute)}>
      {strictestRateLimits.map(({name, isActive}) => <li key={`${user._id}rateLimitstrict${name}`}><div>
        <LWTooltip title={`Calculated via: ${isActive.toString()}`}><MetaInfo>{name}</MetaInfo></LWTooltip>
      </div></li>)}
    </ul>
    {nonStrictestRateLimitsNames.length > 0 && <LWTooltip title={<div>
      {nonStrictestRateLimitsNames.map(rateLimit => <div key={`${user._id}rateLimit${rateLimit}`}>{rateLimit}</div>)}</div>}>
      <MetaInfo>{nonStrictestRateLimitsNames.length} More</MetaInfo>
    </LWTooltip>}
  </div>;
}

export default registerComponent('UserAutoRateLimitsDisplay', UserAutoRateLimitsDisplay, {styles});


