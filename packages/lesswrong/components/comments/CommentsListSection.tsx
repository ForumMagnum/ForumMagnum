import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentTime } from '../../lib/utils/timeUtil';
import moment from 'moment';
import { userIsAllowedToComment } from '../../lib/collections/users/helpers';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Divider from '@material-ui/core/Divider';
import { useCurrentUser } from '../common/withUser';
import { unflattenComments, CommentTreeNode, flattenComments } from '../../lib/utils/unflatten';
import classNames from 'classnames';
import * as _ from 'underscore';

export const NEW_COMMENT_MARGIN_BOTTOM = "1.3em"

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    fontWeight: 400,
    margin: "0px auto 15px auto",
    ...theme.typography.commentStyle,
    position: "relative"
  },
  maxWidthRoot: {
    maxWidth: 720,
  },
  inline: {
    display: 'inline',
    color: theme.palette.text.secondary,
  },
  clickToHighlightNewSince: {
    display: 'inline',
    color: theme.palette.text.secondary,
    "@media print": { display: "none" },
  },
  button: {
    color: theme.palette.lwTertiary.main,
  },
  newComment: {
    border: theme.palette.border.commentBorder,
    position: 'relative',
    borderRadius: 3,
    marginBottom: NEW_COMMENT_MARGIN_BOTTOM,
    "@media print": {
      display: "none"
    }
  },
  newCommentLabel: {
    paddingLeft: theme.spacing.unit*1.5,
    ...theme.typography.commentStyle,
    ...theme.typography.body2,
    fontWeight: 600,
    marginTop: 12
  },
  newCommentSublabel: {
    paddingLeft: theme.spacing.unit*1.5,
    ...theme.typography.commentStyle,
    color: theme.palette.grey[600],
    fontStyle: 'italic',
    marginTop: 4,
  }
})

interface CommentsListSectionState {
  highlightDate: Date,
  anchorEl: any,
}

const CommentsListSection = ({post, tag, commentCount, loadMoreCount, totalComments, loadMoreComments, loadingMoreComments, comments, parentAnswerId, startThreadTruncated, newForm=true, approvalSection, refetchAfterApproval, classes}: {
  post?: PostsDetails,
  tag?: TagBasicInfo,
  commentCount: number,
  loadMoreCount?: number,
  totalComments: number,
  loadMoreComments: any,
  loadingMoreComments: boolean,
  comments: CommentsList[],
  parentAnswerId?: string,
  startThreadTruncated?: boolean,
  newForm: boolean,
  approvalSection?: 'approved' | 'rejected',
  refetchAfterApproval?: () => Promise<void>,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const commentTree = unflattenComments(comments);

  const approvedOrPendingCommentTree = commentTree.filter(({ item: { commentApproval }}) => !commentApproval || commentApproval.status === 'approved');
  const rejectedCommentTree = commentTree.filter(({ item: { commentApproval }}) => commentApproval?.status === 'rejected');

  const getApprovalFilteredCommentsTree = (approvalSection: 'approved' | 'rejected') => {
    if (approvalSection === 'approved') return approvedOrPendingCommentTree;
    return rejectedCommentTree;
  };

  const approvedOrPendingComments = flattenComments(approvedOrPendingCommentTree);
  const rejectedComments = flattenComments(rejectedCommentTree);
  
  const [highlightDate,setHighlightDate] = useState<Date|undefined>(post?.lastVisitedAt && new Date(post.lastVisitedAt));
  const [anchorEl,setAnchorEl] = useState<HTMLElement|null>(null);
  const newCommentsSinceDate = highlightDate ? _.filter(comments, comment => new Date(comment.postedAt).getTime() > new Date(highlightDate).getTime()).length : 0;
  const now = useCurrentTime();

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  }

  const handleDateChange = (date) => {
    setHighlightDate(date)
    setAnchorEl(null);
  }

  const renderCommentCountComponent = () => {
    const newLimit = commentCount + (loadMoreCount || commentCount);

    let displayedCommentCount = commentCount;
    let loadedCommentCount = totalComments;

    if (approvalSection) {
      const approvedOrPendingCommentCount = approvedOrPendingComments.length;
      const rejectedCommentCount = rejectedComments.length;

      displayedCommentCount = approvalSection === 'approved'
        ? approvedOrPendingCommentCount
        : rejectedCommentCount;

      loadedCommentCount = displayedCommentCount;
    }

    if (commentCount < totalComments) {
      return (
        <span>
          Rendering {displayedCommentCount}/{totalComments} comments, sorted by <Components.CommentsViews post={post} />
          {loadingMoreComments ? <Components.Loading /> : <a onClick={() => loadMoreComments(newLimit)}> (show more) </a>}
        </span>
      );
    }

    return (
      <span>
        { loadedCommentCount } comments, sorted by <Components.CommentsViews post={post} />
      </span>
    );
  }

  const renderTitleComponent = () => {
    const { CommentsListMeta, Typography } = Components
    const suggestedHighlightDates = [moment(now).subtract(1, 'day'), moment(now).subtract(1, 'week'), moment(now).subtract(1, 'month'), moment(now).subtract(1, 'year')]
    const newLimit = commentCount + (loadMoreCount || commentCount)
    const approvalSectionTitle = approvalSection && <CommentsListMeta>
      <Typography
        variant="body2"
        component='span'
        className={classes.inline}
      >
        {approvalSection === 'approved' ? 'Approved and Pending Comments' : 'Rejected Comments'}
      </Typography>
      <br />
    </CommentsListMeta>;

    const listSectionTitle = <CommentsListMeta>
      <Typography
        variant="body2"
        component='span'
        className={classes.inline}>
        {renderCommentCountComponent()}
      </Typography>
      {post && <Typography
        variant="body2"
        component='span'
        className={classes.clickToHighlightNewSince}
      >
        {highlightDate && newCommentsSinceDate>0 && `Highlighting ${newCommentsSinceDate} new comments since `}
        {highlightDate && !newCommentsSinceDate && "No new comments since "}
        {!highlightDate && "Click to highlight new comments since: "}
        <a className={classes.button} onClick={handleClick}>
          <Components.CalendarDate date={highlightDate || now}/>
        </a>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
        >
          {currentUser && post && <Components.LastVisitList
            postId={post._id}
            currentUser={currentUser}
            clickCallback={handleDateChange}/>}
          <Divider />
          {suggestedHighlightDates.map(date => {
            return <MenuItem key={date.toString()} onClick={() => handleDateChange(date)}>
              {date.calendar().toString()}
            </MenuItem>
          })}
        </Menu>
      </Typography>}
    </CommentsListMeta>;

    return <>
      {approvalSectionTitle}
      {listSectionTitle}
    </>;
  }

  // TODO: Update "author has blocked you" message to include link to moderation guidelines (both author and LW)

  const postAuthor = post?.user || null;

  const sectionCommentTree = approvalSection
    ? getApprovalFilteredCommentsTree(approvalSection)
    : commentTree;

  return (
    <div className={classNames(classes.root, {[classes.maxWidthRoot]: !tag})}>
      <div id="comments"/>

      {newForm && (!currentUser || !post || userIsAllowedToComment(currentUser, post, postAuthor)) && !post?.draft &&
        <div id="posts-thread-new-comment" className={classes.newComment}>
          <div className={classes.newCommentLabel}>New Comment</div>
          {post?.isEvent && (post?.rsvps?.length > 0) && (
            <div className={classes.newCommentSublabel}>
              Everyone who RSVP'd to this event will be notified.
            </div>
          )}
          <Components.CommentsNewForm
            post={post} tag={tag}
            prefilledProps={{
              parentAnswerId: parentAnswerId}}
            type="comment"
          />
        </div>
      }
      {currentUser && post && !userIsAllowedToComment(currentUser, post, postAuthor) &&
        <Components.CantCommentExplanation post={post}/>
      }
      { totalComments ? renderTitleComponent() : null }
      <Components.CommentsList
        treeOptions={{
          highlightDate: highlightDate,
          post: post,
          postPage: true,
          tag: tag,
          refetchAfterApproval: refetchAfterApproval
        }}
        totalComments={totalComments}
        comments={sectionCommentTree}
        startThreadTruncated={startThreadTruncated}
        parentAnswerId={parentAnswerId}
      />
      <Components.PostsPageCrosspostComments />
    </div>
  );
}

const CommentsListSectionComponent = registerComponent("CommentsListSection", CommentsListSection, {styles});

declare global {
  interface ComponentTypes {
    CommentsListSection: typeof CommentsListSectionComponent,
  }
}

