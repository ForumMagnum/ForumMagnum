import { registerComponent } from '../../lib/vulcan-lib/components';
import React, { useState } from 'react';
import withErrorBoundary from '../common/withErrorBoundary'
import FlagIcon from '@/lib/vendor/@material-ui/icons/src/Flag';
import { userCanDo } from '../../lib/vulcan-users/permissions';
import classNames from 'classnames';
import { hideScrollBars } from '../../themes/styleUtils';
import { getReasonForReview } from '../../lib/collections/moderatorActions/helpers';
import { truncate } from '../../lib/editor/ellipsize';
import { usePublishedPosts } from '../hooks/usePublishedPosts';
import MetaInfo from "../common/MetaInfo";
import UserReviewMetadata from "./ModeratorUserInfo/UserReviewMetadata";
import LWTooltip from "../common/LWTooltip";
import UserReviewStatus from "./ModeratorUserInfo/UserReviewStatus";
import SunshineNewUserPostsList from "./SunshineNewUserPostsList";
import ContentSummaryRows from "./ModeratorUserInfo/ContentSummaryRows";
import SunshineNewUserCommentsList from "./SunshineNewUserCommentsList";
import ModeratorActions from "./ModeratorActions";
import UsersName from "../users/UsersName";
import NewUserDMSummary from "./ModeratorUserInfo/NewUserDMSummary";
import SunshineUserMessages from "./SunshineUserMessages";
import FirstContentIcons from "./FirstContentIcons";
import UserAutoRateLimitsDisplay from "./ModeratorUserInfo/UserAutoRateLimitsDisplay";
import { useQuery } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";

const CommentsListWithParentMetadataMultiQuery = gql(`
  query multiCommentUsersReviewInfoCardQuery($selector: CommentSelector, $limit: Int, $enableTotal: Boolean) {
    comments(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...CommentsListWithParentMetadata
      }
      totalCount
    }
  }
`);

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

const UsersReviewInfoCard = ({ user, refetch, currentUser, classes }: {
  user: SunshineUsersList,
  currentUser: UsersCurrent,
  refetch: () => void,
  classes: ClassesType<typeof styles>,
}) => {
  const [contentExpanded, setContentExpanded] = useState<boolean>(false)
  const [bioWordcount, setBioWordcount] = useState<number>(DEFAULT_BIO_WORDCOUNT)
  
  const { posts = [], loading: postsLoading } = usePublishedPosts(user._id, CONTENT_LIMIT);
  
  const { data, loading: commentsLoading } = useQuery(CommentsListWithParentMetadataMultiQuery, {
    variables: {
      selector: { sunshineNewUsersComments: { userId: user._id } },
      limit: CONTENT_LIMIT,
      enableTotal: false,
    },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  const comments = data?.comments?.results ?? [];

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

export default registerComponent('UsersReviewInfoCard', UsersReviewInfoCard, {
  styles,
  hocs: [
    withErrorBoundary,
  ],
});


