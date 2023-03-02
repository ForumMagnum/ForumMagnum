import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentTime } from '../../lib/utils/timeUtil';
import moment from 'moment';
import { userIsAllowedToComment } from '../../lib/collections/users/helpers';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Divider from '@material-ui/core/Divider';
import { useCurrentUser } from '../common/withUser';
import { unflattenComments } from '../../lib/utils/unflatten';
import classNames from 'classnames';
import * as _ from 'underscore';
import { postGetCommentCountStr } from '../../lib/collections/posts/helpers';
import { CommentsNewFormProps } from './CommentsNewForm';

export const NEW_COMMENT_MARGIN_BOTTOM = "1.3em"

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    fontWeight: 400,
    margin: "10px auto 5px auto",
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
  },
  debateCommentsList: {
    // marginLeft: 'auto',
    // width: '95%'
  }
})

const DebateCommentsListSection = ({post, totalComments, comments, startThreadTruncated, newForm=true, newFormProps={}, classes}: {
  post: PostsDetails,
  totalComments: number,
  comments: CommentsList[],
  startThreadTruncated?: boolean,
  newForm: boolean,
  newFormProps?: Partial<CommentsNewFormProps>,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const commentTree = unflattenComments(comments);
  
  const { CommentsList, PostsPageCrosspostComments } = Components

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

  const handleDateChange = (date: Date) => {
    setHighlightDate(date)
    setAnchorEl(null);
  }

  const renderTitleComponent = () => {
    const { CommentsListMeta, Typography } = Components
    const suggestedHighlightDates = [moment(now).subtract(1, 'day'), moment(now).subtract(1, 'week'), moment(now).subtract(1, 'month'), moment(now).subtract(1, 'year')]
    return <CommentsListMeta>
      <Typography
        variant="body2"
        component='span'
        className={classes.inline}
      >
        <span>
          {postGetCommentCountStr(post, totalComments)}, sorted by <Components.CommentsViews post={post} />
        </span>
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
            return <MenuItem key={date.toString()} onClick={() => handleDateChange(date.toDate())}>
              {date.calendar().toString()}
            </MenuItem>
          })}
        </Menu>
      </Typography>}
    </CommentsListMeta>
  }

  // TODO: Update "author has blocked you" message to include link to moderation guidelines (both author and LW)

  const postAuthor = post?.user || null;

  const userIsDebateParticipant =
    currentUser
    && post?.debate
    && (currentUser._id === postAuthor?._id || post?.coauthorStatuses.some(coauthor => coauthor.userId === currentUser._id));

  return (
    <div className={classNames(classes.root, classes.maxWidthRoot)}>
      <div id="comments"/>

      {newForm && (!currentUser || !post || userIsAllowedToComment(currentUser, post, postAuthor)) && (!post?.draft || userIsDebateParticipant) &&
        <div id={`posts-debate-thread-new-comment`} className={classes.newComment}>
          <div className={classes.newCommentLabel}>New Comment</div>
          <Components.CommentsNewForm
            post={post}
            type="comment"
            {...newFormProps}
          />
        </div>
      }
      {currentUser && post && !userIsAllowedToComment(currentUser, post, postAuthor) &&
        <Components.CantCommentExplanation post={post}/>
      }
      {/* { totalComments ? renderTitleComponent() : null } */}
      <div className={classes.debateCommentsList}>
        <CommentsList
          treeOptions={{
            highlightDate: highlightDate,
            post: post,
            postPage: true,
            showCollapseButtons: true,
            hideParentCommentToggle: true,
            forceSingleLine: true
          }}
          totalComments={totalComments}
          comments={commentTree}
          startThreadTruncated={startThreadTruncated}
        />
      </div>
      <PostsPageCrosspostComments />
    </div>
  );
}

const DebateCommentsListSectionComponent = registerComponent("DebateCommentsListSection", DebateCommentsListSection, {styles});

declare global {
  interface ComponentTypes {
    DebateCommentsListSection: typeof DebateCommentsListSectionComponent,
  }
}

