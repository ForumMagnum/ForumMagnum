/* global confirm */
import { Components, registerComponent } from '../../lib/vulcan-lib';
import React, { useState } from 'react';
import withErrorBoundary from '../common/withErrorBoundary'
import FlagIcon from '@material-ui/icons/Flag';
import DescriptionIcon from '@material-ui/icons/Description'
import { useMulti } from '../../lib/crud/withMulti';
import MessageIcon from '@material-ui/icons/Message'
import * as _ from 'underscore';
import { userCanDo } from '../../lib/vulcan-users/permissions';
import classNames from 'classnames';

export const getTitle = (s: string|null) => s ? s.split("\\")[0] : ""

const styles = (theme: ThemeType): JssStyles => ({
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
  hoverPostIcon: {
    height: 16,
    color: theme.palette.grey[700],
    position: "relative",
    top: 3
  },
  basicInfoRow: {
    padding: 16,
    paddingBottom: 14,
    borderBottom: theme.palette.border.extraFaint
  },
  row: {
    display: "flex",
    alignItems: "center",
  },
  disabled: {
    opacity: .2,
    cursor: "default"
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
  sortButton: {
    marginLeft: 6,
    cursor: "pointer"
  },
  sortSelected: {
    color: theme.palette.grey[900]
  },
  bio: {
    '& a': {
      color: theme.palette.primary.main,
    }
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
    borderTop: theme.palette.border.extraFaint
  },
  expandButton: {
    display: "flex",
    justifyContent: "right",
    color: theme.palette.grey[500]
  },
  contentCollapsed: {
    maxHeight: 300,
    overflowY: "scroll",
    cursor: "pointer",
    '&:after': { 
      content: '"<a>Expand</a>"',
    }
  },
  contentSummaryRow: {
    display: "flex",
    flexWrap: "wrap"
  },
  reviewedAt: {
    marginTop: 16,
    fontStyle: "italic"
  }
})

const UsersReviewInfoCard = ({ user, refetch, currentUser, classes }: {
  user: SunshineUsersList,
  currentUser: UsersCurrent,
  refetch: () => void,
  classes: ClassesType,
}) => {
    
  const [contentSort, setContentSort] = useState<'baseScore' | 'postedAt'>("baseScore")
  const [contentExpanded, setContentExpanded] = useState<boolean>(false)
    
  
  const { results: posts, loading: postsLoading } = useMulti({
    terms:{view:"sunshineNewUsersPosts", userId: user._id},
    collectionName: "Posts",
    fragmentName: 'SunshinePostsList',
    fetchPolicy: 'cache-and-network',
    limit: 10
  });
  
  const { results: comments, loading: commentsLoading } = useMulti({
    terms:{view:"sunshineNewUsersComments", userId: user._id},
    collectionName: "Comments",
    fragmentName: 'CommentsListWithParentMetadata',
    fetchPolicy: 'cache-and-network',
    limit: 10
  });
  
  const commentKarmaPreviews = comments ? _.sortBy(comments, contentSort) : []
  const postKarmaPreviews = posts ? _.sortBy(posts, contentSort) : []
  
  const { MetaInfo, FormatDate, SunshineUserMessages, CommentKarmaWithPreview, PostKarmaWithPreview, LWTooltip, UsersNameWrapper, Loading, SunshineNewUserPostsList, SunshineNewUserCommentsList, ModeratorActions, UsersName } = Components
  
  const hiddenPostCount = user.maxPostCount - user.postCount
  const hiddenCommentCount = user.maxCommentCount - user.commentCount
  
  if (!userCanDo(currentUser, "posts.moderate.all")) return null


  const basicInfoRow = <div className={classes.basicInfoRow}>
    <div>
      <div className={classes.displayName}>
        <UsersName user={user}/>
        {(user.postCount > 0 && !user.reviewedByUserId) && <DescriptionIcon className={classes.icon}/>}
        {user.sunshineFlagged && <FlagIcon className={classes.icon}/>}
      </div>
    </div>

    <div className={classes.row}>
      <MetaInfo className={classes.info}>
        { user.karma || 0 } karma
      </MetaInfo>
      <div>{user.email}</div>
      <MetaInfo className={classes.info}>
        <FormatDate date={user.createdAt}/>
      </MetaInfo>
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

  const postCommentSortingRow = <div>
    Sort by: <span className={classNames(classes.sortButton, {[classes.sortSelected]: contentSort === "baseScore"})} onClick={() => setContentSort("baseScore")}>
        karma
      </span>
    <span className={classNames(classes.sortButton, {[classes.sortSelected]: contentSort === "postedAt"})} onClick={() => setContentSort("postedAt")}>
        postedAt
      </span>
  </div>

  const postSummaryRow = <div className={classes.contentSummaryRow}>
    <LWTooltip title="Post count">
        <span>
          { user.postCount || 0 }
          <DescriptionIcon className={classes.hoverPostIcon}/>
        </span>
    </LWTooltip>
    {postKarmaPreviews.map(post => <PostKarmaWithPreview key={post._id} post={post}/>)}
    { hiddenPostCount ? <span> ({hiddenPostCount} deleted)</span> : null}
  </div>

  const commentSummaryRow = <div className={classes.contentSummaryRow}>
    <LWTooltip title="Comment count">
      { user.commentCount || 0 }
    </LWTooltip>
    <MessageIcon className={classes.icon}/>
    {commentKarmaPreviews.map(comment => <CommentKarmaWithPreview key={comment._id} comment={comment}/>)}
    { hiddenCommentCount ? <span> ({hiddenCommentCount} deleted)</span> : null}
  </div>
  
  return (
    <div className={classes.root}>
      {basicInfoRow}
      <div className={classes.columns}>
        <div className={classes.infoColumn}>
          <div>
            <ModeratorActions user={user} currentUser={currentUser} refetch={refetch} comments={comments} posts={posts}/>
            {user.reviewedAt
              ? <div className={classes.reviewedAt}>Reviewed <FormatDate date={user.reviewedAt}/> ago by <UsersNameWrapper documentId={user.reviewedByUserId}/></div>
              : null 
            }
            {user.banned
              ? <p><em>Banned until <FormatDate date={user.banned}/></em></p>
              : null 
            }
          </div>
        </div>
        <div className={classes.contentColumn}>
          <div dangerouslySetInnerHTML={{__html: user.htmlBio}} className={classes.bio}/>
          {user.website && <div>Website: <a href={`https://${user.website}`} target="_blank" rel="noopener noreferrer" className={classes.website}>{user.website}</a></div>}
          {votesRow}
          {postCommentSortingRow}
          {postSummaryRow}
          {(commentsLoading || postsLoading) && <Loading/>}
          {commentSummaryRow}
          <div 
            className={classNames(classes.content, {[classes.contentCollapsed]: !contentExpanded})} onClick={() => setContentExpanded(!contentExpanded)}
          >
            <SunshineNewUserPostsList posts={posts} user={user}/>
            <SunshineNewUserCommentsList comments={comments} user={user}/>
          </div>
        </div>
        <div className={classes.messagesColumn}>
          <SunshineUserMessages user={user}/>
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


