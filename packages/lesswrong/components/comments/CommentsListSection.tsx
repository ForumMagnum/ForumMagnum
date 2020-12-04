import React, { Component } from 'react';
import {
  Components,
  registerComponent
} from '../../lib/vulcan-lib';
import moment from 'moment';
import { userIsAllowedToComment } from '../../lib/collections/users/helpers';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Divider from '@material-ui/core/Divider';
import withUser from '../common/withUser';
import type { CommentTreeNode } from '../../lib/utils/unflatten';
import classNames from 'classnames';

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
  }
})

interface ExternalProps {
  lastEvent?: any,
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
}
interface CommentsListSectionProps extends ExternalProps, WithUserProps, WithStylesProps {
}
interface CommentsListSectionState {
  highlightDate: Date,
  anchorEl: any,
}

class CommentsListSection extends Component<CommentsListSectionProps,CommentsListSectionState> {
  constructor(props: CommentsListSectionProps) {
    super(props);
    const {lastEvent, post} = this.props;

    this.state = {
      highlightDate:
        (lastEvent && lastEvent.properties && lastEvent.properties.createdAt
          && new Date(lastEvent.properties.createdAt))
        || (post?.lastVisitedAt &&
          new Date(post.lastVisitedAt))
        || new Date(),
      anchorEl: null,
    }
  }

  handleClick = (event: React.MouseEvent) => {
    this.setState({ anchorEl: event.currentTarget });
  };

  handleClose = () => {
    this.setState({ anchorEl: null })
  }

  handleDateChange = (date) => {
    this.setState({ highlightDate: date, anchorEl: null });
  }

  renderTitleComponent = () => {
    const { commentCount, loadMoreCount, totalComments, loadMoreComments, loadingMoreComments, post, currentUser, classes } = this.props;
    const { anchorEl, highlightDate } = this.state
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
              Rendering {commentCount}/{totalComments} comments, sorted by <Components.CommentsViews post={this.props.post} />
              {loadingMoreComments ? <Components.Loading /> : <a onClick={() => loadMoreComments(newLimit)}> (show more) </a>}
            </span> :
            <span>
              { totalComments } comments, sorted by <Components.CommentsViews post={this.props.post} />
            </span>
        }
      </Typography>
      {post && <Typography
        variant="body2"
        component='span'
        className={classes.inline}
      >
        Highlighting new comments since <a className={classes.button} onClick={this.handleClick}>
          <Components.CalendarDate date={highlightDate}/>
        </a>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={this.handleClose}
        >
          {currentUser && post && <Components.LastVisitList
            postId={post._id}
            currentUser={currentUser}
            clickCallback={this.handleDateChange}/>}
          <Divider />
          {suggestedHighlightDates.map(date => {
            return <MenuItem key={date.toString()} onClick={() => this.handleDateChange(date)}>
              {date.calendar().toString()}
            </MenuItem>
          })}
        </Menu>
      </Typography>}
    </CommentsListMeta>
  }

  render() {
    const { currentUser, comments, post, tag, classes, totalComments, parentAnswerId, startThreadTruncated, newForm=true } = this.props;
    // TODO: Update "author has blocked you" message to include link to moderation guidelines (both author and LW)

    return (
      <div className={classNames(classes.root, {[classes.maxWidthRoot]: !tag})}>
        { this.props.totalComments ? this.renderTitleComponent() : null }
        <div id="comments"/>

        {newForm && (!currentUser || !post || userIsAllowedToComment(currentUser, post)) && !post?.draft &&
          <div id="posts-thread-new-comment" className={classes.newComment}>
            <div className={classes.newCommentLabel}>New Comment</div>
            <Components.CommentsNewForm
              post={post} tag={tag}
              prefilledProps={{
                parentAnswerId: parentAnswerId}}
              type="comment"
            />
          </div>
        }
        {currentUser && post && !userIsAllowedToComment(currentUser, post) &&
          <Components.CantCommentExplanation post={post}/>
        }
        <Components.CommentsList
          totalComments={totalComments}
          comments={comments}
          highlightDate={this.state.highlightDate}
          post={post} tag={tag}
          postPage
          startThreadTruncated={startThreadTruncated}
          parentAnswerId={parentAnswerId}
        />
      </div>
    );
  }
}

const CommentsListSectionComponent = registerComponent<ExternalProps>(
  "CommentsListSection", CommentsListSection, {
    styles,
    hocs: [withUser]
  }
);

declare global {
  interface ComponentTypes {
    CommentsListSection: typeof CommentsListSectionComponent,
  }
}

