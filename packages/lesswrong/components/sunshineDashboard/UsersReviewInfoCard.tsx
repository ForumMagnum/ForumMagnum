/* global confirm */
import { Components, registerComponent } from '../../lib/vulcan-lib';
import React, { useState } from 'react';
import withErrorBoundary from '../common/withErrorBoundary'
import FlagIcon from '@material-ui/icons/Flag';
import DescriptionIcon from '@material-ui/icons/Description'
import { useMulti } from '../../lib/crud/withMulti';
import MessageIcon from '@material-ui/icons/Message'
import * as _ from 'underscore';
import Input from '@material-ui/core/Input';
import { userCanDo } from '../../lib/vulcan-users/permissions';
import classNames from 'classnames';
import { Link } from '../../lib/reactRouterWrapper';
import { userGetProfileUrl} from '../../lib/collections/users/helpers';
import { LOW_AVERAGE_KARMA_COMMENT_ALERT, LOW_AVERAGE_KARMA_POST_ALERT, MODERATOR_ACTION_TYPES, RATE_LIMIT_ONE_PER_DAY } from '../../lib/collections/moderatorActions/schema';
import { isLowAverageKarmaContent } from '../../lib/collections/moderatorActions/helpers';


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
    marginTop: 4,
    fontSize: theme.typography.body2.fontSize,
    marginBottom: 16
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
  row: {
    display: "flex",
    alignItems: "center",
  },
  permissionsRow: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 8,
    marginTop: 8
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
  notes: {
    border: theme.palette.border.normal,
    borderRadius: 2,
    paddingLeft: 8,
    paddingRight: 8,
    paddingTop: 4,
    paddingBottom: 4,
    marginTop: 8,
    marginBottom: 8,
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
  modButton:{
    marginTop: 6,
    marginRight: 16,
    cursor: "pointer",
    '&:hover': {
      opacity: .5
    }
  },
  snooze10: {
    color: theme.palette.primary.main,
    fontSize: 34,
    marginTop: 4
  },
  permissionsButton: {
    padding: 6,
    paddingTop: 3,
    paddingBottom: 3,
    border: theme.palette.border.normal,
    borderRadius: 2,
    marginRight: 8,
    marginBottom: 8,
    cursor: "pointer",
    whiteSpace: "nowrap"
  },
  permissionDisabled: {
    border: "none"
  },
  columns: {
    display: 'flex'
  },
  infoColumn: {
    width: '30%',
    padding: 16,
    borderRight: theme.palette.border.extraFaint,
  },
  contentColumn: {
    width: '35%',
    padding: 16,
    borderRight: theme.palette.border.extraFaint,
    position: "relative"
  },
  actionsColumn: {
    width: '35%',
    padding: 16
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
    overflow: "hidden"
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
  
  
  const [notes, setNotes] = useState(user.sunshineNotes || "")
  const [contentSort, setContentSort] = useState<'baseScore' | 'postedAt'>("baseScore")
  const [contentExpanded, setContentExpanded] = useState<boolean>(false)
    
  const handleNotes = () => {
    if (notes != user.sunshineNotes) {
      void updateUser({
        selector: {_id: user._id},
        data: {
          sunshineNotes: notes
        }
      })
    }
  }
  
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
  
  const { MetaInfo, FormatDate, SunshineUserMessages, CommentKarmaWithPreview, PostKarmaWithPreview, LWTooltip, UsersNameWrapper, Loading, SunshineNewUserPostsList, SunshineNewUserCommentsList } = Components
  
  const hiddenPostCount = user.maxPostCount - user.postCount
  const hiddenCommentCount = user.maxCommentCount - user.commentCount
  
  if (!userCanDo(currentUser, "posts.moderate.all")) return null

  
  const signAndDate = (sunshineNotes:string) => {
    if (!sunshineNotes.match(signature)) {
      const padding = !sunshineNotes ? ": " : ": \n\n"
      return signature + padding + sunshineNotes
    }
    return sunshineNotes
  }
  
  const handleClick = () => {
    const signedNotes = signAndDate(notes)
    if (signedNotes != notes) {
      setNotes(signedNotes)
    }
  }

  const basicInfoRow = <div>
    <div>
      <Link className={classes.displayName} to={userGetProfileUrl(user)}>
        {user.displayName} 
      </Link>
      {(user.postCount > 0 && !user.reviewedByUserId) && <DescriptionIcon className={classes.icon}/>}
      {user.sunshineFlagged && <FlagIcon className={classes.icon}/>}
    </div>

    <div className={classes.row}>
      <MetaInfo className={classes.info}>
        { user.karma || 0 }
      </MetaInfo>
      <MetaInfo className={classes.info}>
        <FormatDate date={user.createdAt}/>
      </MetaInfo>
    </div>
    <div>{user.email}</div>


  </div>

  const moderatorActionLogRow = <div>
    {user.moderatorActions
      .filter(moderatorAction => moderatorAction.active)
      .map(moderatorAction => {
        let averageContentKarma: number | undefined;
        if (moderatorAction.type === LOW_AVERAGE_KARMA_COMMENT_ALERT) {
          const mostRecentComments = _.sortBy(comments ?? [], 'postedAt').reverse();
          ({ averageContentKarma } = isLowAverageKarmaContent(mostRecentComments ?? [], 'comment'));
        } else if (moderatorAction.type === LOW_AVERAGE_KARMA_POST_ALERT) {
          const mostRecentPosts = _.sortBy(posts ?? [], 'postedAt').reverse();
          ({ averageContentKarma } = isLowAverageKarmaContent(mostRecentPosts ?? [], 'post'));
        }

        const suffix = typeof averageContentKarma === 'number' ? ` (${averageContentKarma})` : '';

        return <div key={`${user._id}_${moderatorAction.type}`}>{`${MODERATOR_ACTION_TYPES[moderatorAction.type]}${suffix}`}</div>;
      })
    }
  </div>

  const moderatorNotesColumn = <div className={classes.notes}>
    <Input
      value={notes}
      fullWidth
      onChange={e => setNotes(e.target.value)}
      onClick={e => handleClick()}
      onBlur={handleNotes}
      disableUnderline
      placeholder="Notes for other moderators"
      multiline
      rowsMax={5}
    />
  </div>
  
  const permissionsRow = <div className={classes.permissionsRow}>
      <LWTooltip title={`${user.postingDisabled ? "Enable" : "Disable"} this user's ability to create posts`}>
        <div className={classNames(classes.permissionsButton, {[classes.permissionDisabled]: user.postingDisabled})} onClick={handleDisablePosting}>
          Posts
        </div>
      </LWTooltip>
      <LWTooltip title={`${user.allCommentingDisabled ? "Enable" : "Disable"} this user's to comment (including their own shortform)`}>
        <div className={classNames(classes.permissionsButton, {[classes.permissionDisabled]: user.allCommentingDisabled})} onClick={handleDisableAllCommenting}>
          All Comments
        </div>
      </LWTooltip>
      <LWTooltip title={`${user.commentingOnOtherUsersDisabled ? "Enable" : "Disable"} this user's ability to comment on other people's posts`}>
        <div className={classNames(classes.permissionsButton, {[classes.permissionDisabled]: user.commentingOnOtherUsersDisabled})} onClick={handleDisableCommentingOnOtherUsers}>
          Other Comments
        </div>
      </LWTooltip>
      <LWTooltip title={`${user.conversationsDisabled ? "Enable" : "Disable"} this user's ability to start new private conversations`}>
        <div className={classNames(classes.permissionsButton, {[classes.permissionDisabled]: user.conversationsDisabled})}onClick={handleDisableConversations}>
          Conversations
        </div>
      </LWTooltip>
      <LWTooltip title={`${mostRecentRateLimit?.active ? "Un-rate-limit" : "Rate-limit"} this user's ability to post and comment`}>
        <div className={classNames(classes.permissionsButton, {[classes.permissionDisabled]: !!mostRecentRateLimit?.active})}onClick={handleRateLimit}>
          {MODERATOR_ACTION_TYPES[RATE_LIMIT_ONE_PER_DAY]}
        </div>
      </LWTooltip>
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
      <div className={classes.columns}>
        <div className={classes.infoColumn}>
          {basicInfoRow}
          {moderatorNotesColumn}
          <div>
            {moderatorActionLogRow}
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
          <div className={classNames(classes.content, {[classes.contentCollapsed]: !contentExpanded})}>
            <SunshineNewUserPostsList posts={posts} user={user}/>
            <SunshineNewUserCommentsList comments={comments} user={user}/>
          </div>
          <a className={classes.expandButton} onClick={() => setContentExpanded(!contentExpanded)}>{contentExpanded ? "Collapse" : "Expand"}</a>
        </div>
        <div className={classes.actionsColumn}>
          {moderatorActionsRow}
          {permissionsRow}
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


