import React, { useState } from 'react';
import {
  Components,
  registerComponent
} from '../../lib/vulcan-lib';
import moment from 'moment';
import { userIsAllowedToComment } from '../../lib/collections/users/helpers';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Divider from '@material-ui/core/Divider';
import { useCurrentUser } from '../common/withUser';
import type { CommentTreeNode } from '../../lib/utils/unflatten';
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
  button: {
    color: theme.palette.lwTertiary.main,
  },
  newComment: {
    border: `solid 1px ${theme.palette.commentBorderGrey}`,
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

const CommentsListSection = ({post, tag, commentCount, loadMoreCount, totalComments, loadMoreComments, loadingMoreComments, comments, parentAnswerId, startThreadTruncated, newForm=true, classes}: {
  post?: PostsDetails,
  tag?: TagBasicInfo,
  commentCount: number,
  loadMoreCount?: number,
  totalComments: number,
  loadMoreComments: any,
  loadingMoreComments: boolean,
  comments: Array<CommentTreeNode<CommentsList>>,
  parentAnswerId?: string,
  startThreadTruncated?: boolean,
  newForm: boolean,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const [highlightDate,setHighlightDate] = useState<Date|undefined>(post?.lastVisitedAt && new Date(post.lastVisitedAt));
  const [anchorEl,setAnchorEl] = useState<HTMLElement|null>(null);
  const newCommentsSinceDate = highlightDate ? _.filter(comments, comment => new Date(comment.item.postedAt).getTime() > new Date(highlightDate).getTime()).length : 0;

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

  const renderTitleComponent = () => {
    const { CommentsListMeta, Typography } = Components
    const suggestedHighlightDates = [moment().subtract(1, 'day'), moment().subtract(1, 'week'), moment().subtract(1, 'month'), moment().subtract(1, 'year')]
    const newLimit = commentCount + (loadMoreCount || commentCount)
    return <CommentsListMeta>
      <Typography
        variant="body2"
        component='span'
        className={classes.inline}>
        {
          (commentCount < totalComments) ?
            <span>
              Rendering {commentCount}/{totalComments} comments, sorted by <Components.CommentsViews post={post} />
              {loadingMoreComments ? <Components.Loading /> : <a onClick={() => loadMoreComments(newLimit)}> (show more) </a>}
            </span> :
            <span>
              { totalComments } comments, sorted by <Components.CommentsViews post={post} />
            </span>
        }
      </Typography>
      {post && <Typography
        variant="body2"
        component='span'
        className={classes.inline}
      >
        {highlightDate && newCommentsSinceDate>0 && `Highlighting ${newCommentsSinceDate} new comments since `}
        {highlightDate && !newCommentsSinceDate && "No new comments since "}
        {!highlightDate && "Click to highlight new comments since: "}
        <a className={classes.button} onClick={handleClick}>
          <Components.CalendarDate date={highlightDate || new Date()}/>
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
    </CommentsListMeta>
  }

  // TODO: Update "author has blocked you" message to include link to moderation guidelines (both author and LW)

  const postAuthor = post?.user || null;
  return (
    <div className={classNames(classes.root, {[classes.maxWidthRoot]: !tag})}>
      { totalComments ? renderTitleComponent() : null }
      <div id="comments"/>

      {newForm && (!currentUser || !post || userIsAllowedToComment(currentUser, post, postAuthor)) && !post?.draft &&
        <div id="posts-thread-new-comment" className={classes.newComment}>
          <div className={classes.newCommentLabel}>New Comment</div>
          {post?.isEvent && post?.rsvps?.length && (
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
      <Components.CommentsList
        treeOptions={{
          highlightDate: highlightDate,
          post: post,
          postPage: true,
          tag: tag,
        }}
        totalComments={totalComments}
        comments={comments}
        startThreadTruncated={startThreadTruncated}
        parentAnswerId={parentAnswerId}
      />
    </div>
  );
}

const CommentsListSectionComponent = registerComponent("CommentsListSection", CommentsListSection, {styles});

declare global {
  interface ComponentTypes {
    CommentsListSection: typeof CommentsListSectionComponent,
  }
}

