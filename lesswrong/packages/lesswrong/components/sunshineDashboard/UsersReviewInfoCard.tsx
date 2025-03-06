import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React, { useState } from 'react';
import withErrorBoundary from '../common/withErrorBoundary'
import FlagIcon from '@material-ui/icons/Flag';
import { useMulti } from '../../lib/crud/withMulti';
import { userCanDo } from '../../lib/vulcan-users/permissions';
import classNames from 'classnames';
import { hideScrollBars } from '../../themes/styleUtils';
import { getReasonForReview } from '../../lib/collections/moderatorActions/helpers';
import { UserKarmaInfo } from '../../lib/rateLimits/types';
import { truncate } from '../../lib/editor/ellipsize';
import { usePublishedPosts } from '../hooks/usePublishedPosts';
import MetaInfo from "@/components/common/MetaInfo";
import UserReviewMetadata from "@/components/sunshineDashboard/ModeratorUserInfo/UserReviewMetadata";
import LWTooltip from "@/components/common/LWTooltip";
import UserReviewStatus from "@/components/sunshineDashboard/ModeratorUserInfo/UserReviewStatus";
import SunshineNewUserPostsList from "@/components/sunshineDashboard/SunshineNewUserPostsList";
import ContentSummaryRows from "@/components/sunshineDashboard/ModeratorUserInfo/ContentSummaryRows";
import SunshineNewUserCommentsList from "@/components/sunshineDashboard/SunshineNewUserCommentsList";
import ModeratorActions from "@/components/sunshineDashboard/ModeratorActions";
import UsersName from "@/components/users/UsersName";
import NewUserDMSummary from "@/components/sunshineDashboard/ModeratorUserInfo/NewUserDMSummary";
import SunshineUserMessages from "@/components/sunshineDashboard/SunshineUserMessages";
import FirstContentIcons from "@/components/sunshineDashboard/FirstContentIcons";
import UserAutoRateLimitsDisplay from "@/components/sunshineDashboard/ModeratorUserInfo/UserAutoRateLimitsDisplay";

export const CONTENT_LIMIT = 20

const styles = (theme: ThemeType) => ({
  root: {
    backgroundColor: theme.palette.grey[0],
    boxShadow: theme.palette.boxShadow.eventCard,
    marginBottom: 16,
    ...theme.typography.body2,
    fontSize: "1rem"
  },
  displayName: {
    fontSize: theme.typography.body1.fontSize,
    marginBottom: 4
  },
  icon: {
    height: 13,
    color: theme.palette.grey[500],
    position: "relative",
    top: 3
  },
  legacyReviewTrigger: {
    marginLeft: 6
  },
  referrerLandingPage: {
    display: 'flex'
  },
  basicInfoRow: {
    padding: 16,
    paddingBottom: 14,
    borderBottom: theme.palette.border.extraFaint,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  bigDownvotes: {
    color: theme.palette.error.dark,
    padding: 6,
    paddingTop: 3,
    paddingBottom: 3,
    marginRight:8,
    borderRadius: "50%",
    fontWeight: 600,
  },
  downvotes: {
    color: theme.palette.error.dark,
    opacity: .75,
    padding: 6,
    paddingTop: 3,
    paddingBottom: 3,
    marginRight:8,
    borderRadius: "50%",
  },
  upvotes: {
    color: theme.palette.primary.dark,
    opacity: .75,
    padding: 6,
    paddingTop: 3,
    paddingBottom: 3,
    marginRight:8,
    borderRadius: "50%",
  },
  bigUpvotes: {
    color: theme.palette.primary.dark,
    padding: 6,
    paddingTop: 3,
    paddingBottom: 3,
    marginRight:8,
    borderRadius: "50%",
    fontWeight: 600,
  },
  votesRow: {
    marginTop: 12,
    marginBottom: 12
  },
  bio: {
    wordBreak: "break-word",
    '& a': {
      color: theme.palette.primary.main,
    },
    '& img': {
      maxWidth: '100%',
    },
    overflow: "hidden",
  },
  website: {
    color: theme.palette.primary.main,
  },
  info: {
    // '& > * + *': {
    //   marginTop: 8,
    // },
    display: 'flex',
    flexWrap: 'wrap'
  },
  columns: {
    display: 'flex'
  },
  infoColumn: {
    width: '30%',
    minWidth: 388,
    padding: 16,
    paddingTop: 12,
    borderRight: theme.palette.border.extraFaint,
    position: "relative",
  },
  contentColumn: {
    width: '38%',
    padding: 16,
    paddingTop: 12,
    borderRight: theme.palette.border.extraFaint,
    position: "relative"
  },
  messagesColumn: {
    width: '32%',
    padding: 16,
    paddingTop: 12,
  },
  content: {
    marginTop: 16,
    marginBottom: 8,
    borderTop: theme.palette.border.extraFaint,
    maxHeight: '90vh',
    overflowY: "scroll"
  },
  expandButton: {
    display: "flex",
    justifyContent: "center",
    color: theme.palette.grey[500],
    borderRadius: 2,
    '&:hover': {
      background: theme.palette.grey[100]
    }
  },
  contentCollapsed: {
    maxHeight: 300,
    overflowY: "scroll",
    cursor: "pointer",
    ...hideScrollBars
  },
  flagged: {
    border: theme.palette.border.intense,
    borderColor: theme.palette.error.main
  }
})

export const DEFAULT_BIO_WORDCOUNT = 250
export const MAX_BIO_WORDCOUNT = 10000

export function getDownvoteRatio(user: UserKarmaInfo): number {
  // First check if the sum of the individual vote count fields
  // add up to something close (with 5%) to the voteReceivedCount field.
  // (They should be equal, but we know there are bugs around counting votes,
  // so to be fair to users we don't want to rate limit them if it's too buggy.)

  let {
    smallUpvoteReceivedCount,
    bigUpvoteReceivedCount,
    smallDownvoteReceivedCount,
    bigDownvoteReceivedCount,
    voteReceivedCount
  } = user;

  smallUpvoteReceivedCount ??= 0;
  bigUpvoteReceivedCount ??= 0;
  smallDownvoteReceivedCount ??= 0;
  bigDownvoteReceivedCount ??= 0;
  voteReceivedCount ??= 0;

  const sumOfVoteCounts = smallUpvoteReceivedCount + bigUpvoteReceivedCount + smallDownvoteReceivedCount + bigDownvoteReceivedCount;
  const denormalizedVoteCountSumDiff = Math.abs(sumOfVoteCounts - voteReceivedCount);
  const voteCountsAreValid = voteReceivedCount > 0
    && (denormalizedVoteCountSumDiff / voteReceivedCount) <= 0.05;

  const totalDownvoteCount = smallDownvoteReceivedCount + bigDownvoteReceivedCount;
  // If vote counts are not valid (i.e. they are negative or voteReceivedCount is 0), then do nothing
  const downvoteRatio = voteCountsAreValid ? (totalDownvoteCount / voteReceivedCount) : 0

  return downvoteRatio
}

const UsersReviewInfoCard = ({ user, refetch, currentUser, classes }: {
  user: SunshineUsersList,
  currentUser: UsersCurrent,
  refetch: () => void,
  classes: ClassesType<typeof styles>,
}) => {
  const [contentExpanded, setContentExpanded] = useState<boolean>(false)
  const [bioWordcount, setBioWordcount] = useState<number>(DEFAULT_BIO_WORDCOUNT)
  
  const { posts = [], loading: postsLoading } = usePublishedPosts(user._id, CONTENT_LIMIT);
  
  const { results: comments = [], loading: commentsLoading } = useMulti({
    terms:{view:"sunshineNewUsersComments", userId: user._id},
    collectionName: "Comments",
    fragmentName: 'CommentsListWithParentMetadata',
    fetchPolicy: 'cache-and-network',
    limit: CONTENT_LIMIT
  });

  const {needsReview: showReviewTrigger, reason: reviewTrigger} = getReasonForReview(user)
  
  if (!userCanDo(currentUser, "posts.moderate.all")) return null
  
  const basicInfoRow = <div className={classes.basicInfoRow}>
    <div>
      <div className={classes.displayName}>
        <UsersName user={user}/>
        <FirstContentIcons user={user}/>
        {user.sunshineFlagged && <FlagIcon className={classes.icon}/>}
        {showReviewTrigger && <MetaInfo className={classes.legacyReviewTrigger}>{reviewTrigger}</MetaInfo>}
      </div>
      <UserReviewStatus user={user}/>
      <UserReviewMetadata user={user}/>
    </div>
    <div>
      <UserAutoRateLimitsDisplay user={user} showKarmaMeta/>
    </div>
  </div>

  const votesRow = <div className={classes.votesRow}>
    <span>Votes: </span>
    <LWTooltip title="Big Upvotes">
      <span className={classes.bigUpvotes}>
        { user.bigUpvoteCount || 0 }
      </span>
    </LWTooltip>
    <LWTooltip title="Upvotes">
      <span className={classes.upvotes}>
        { user.smallUpvoteCount || 0 }
      </span>
    </LWTooltip>
    <LWTooltip title="Downvotes">
      <span className={classes.downvotes}>
        { user.smallDownvoteCount || 0 }
      </span>
    </LWTooltip>
    <LWTooltip title="Big Downvotes">
      <span className={classes.bigDownvotes}>
        { user.bigDownvoteCount || 0 }
      </span>
    </LWTooltip>
  </div>

  const renderExpand = !!(posts?.length || comments?.length)
  const truncatedHtml = truncate(user.htmlBio, bioWordcount, "words")
  
  return (
    <div className={classNames(classes.root, {[classes.flagged]:user.sunshineFlagged})}>
      {basicInfoRow}
      <div className={classes.columns}>
        <div className={classes.infoColumn}>
          <div>
            <ModeratorActions user={user} currentUser={currentUser} refetch={refetch} comments={comments} posts={posts}/>
          </div>
        </div>
        <div className={classes.contentColumn}>
          <div dangerouslySetInnerHTML={{__html: truncatedHtml}} className={classes.bio} onClick={() => setBioWordcount(MAX_BIO_WORDCOUNT)}/>
          {user.website && <div>Website: <a href={`https://${user.website}`} target="_blank" rel="noopener noreferrer" className={classes.website}>{user.website}</a></div>}
          {votesRow}
          <ContentSummaryRows user={user} posts={posts} comments={comments} loading={commentsLoading || postsLoading} />
          <NewUserDMSummary user={user} />
          <div 
            className={classNames(classes.content, {[classes.contentCollapsed]: !contentExpanded})} onClick={() => setContentExpanded(true)}
          >
            <SunshineNewUserPostsList posts={posts} user={user}/>
            <SunshineNewUserCommentsList comments={comments} user={user}/>
          </div>
          {renderExpand && <a className={classes.expandButton} onClick={() => setContentExpanded(!contentExpanded)}>
            <MetaInfo>Expand</MetaInfo>
          </a>}
        </div>
        <div className={classes.messagesColumn}>
          <SunshineUserMessages user={user} currentUser={currentUser}/>
        </div>
      </div>
    </div>
  )
}

const UsersReviewInfoCardComponent = registerComponent('UsersReviewInfoCard', UsersReviewInfoCard, {
  styles,
  hocs: [
    withErrorBoundary,
  ],
});

declare global {
  interface ComponentTypes {
    UsersReviewInfoCard: typeof UsersReviewInfoCardComponent
  }
}

export default UsersReviewInfoCardComponent;
