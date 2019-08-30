import React, { Component } from 'react';
import { FormattedMessage } from 'meteor/vulcan:i18n';
import {
  Components,
  registerComponent
} from 'meteor/vulcan:core';
import moment from 'moment';
import Users from 'meteor/vulcan:users';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Divider from '@material-ui/core/Divider';
import withUser from '../common/withUser';
import { commentBodyStyles } from '../../themes/stylePiping'

const styles = theme => ({
  root: {
    fontWeight: 400,
    maxWidth: 720,
    margin: "0px auto 15px auto",
    ...theme.typography.commentStyle,

    background: "white",
    position: "relative"
  },
  inline: {
    display: 'inline'
  },
  button: {
    color: theme.palette.lwTertiary.main,
  },
  newComment: {
    padding: theme.spacing.unit*1.5,
    paddingTop: 0,
    border: 'solid 1px rgba(0,0,0,.2)',
    position: 'relative',
    marginBottom: "1.3em",
    "@media print": {
      display: "none"
    }
  },
  newCommentLabel: {
    ...theme.typography.commentStyle,
    ...theme.typography.body1,
    fontWeight: 600,
    marginTop: 12
  },
  moderationGuidelinesWrapper: {
    ...commentBodyStyles(theme),
    verticalAlign: 'top',
    display: 'block',
    padding: '10px 0px',
    borderTop: '1px solid rgba(0,0,0,0.2)',
    borderBottom: '1px solid rgba(0,0,0,0.2)',
    marginBottom: 30,
  },
})

class CommentsListSection extends Component {
  constructor(props) {
    super(props);
    const {lastEvent, post} = this.props;

    this.state = {
      highlightDate:
        (lastEvent && lastEvent.properties && lastEvent.properties.createdAt
          && new Date(lastEvent.properties.createdAt))
        || (post && post.lastVisitedAt &&
          new Date(post.lastVisitedAt))
        || new Date(),
    }
  }

  handleClick = event => {
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
    const { CommentsListMeta } = Components
    const suggestedHighlightDates = [moment().subtract(1, 'day'), moment().subtract(1, 'week'), moment().subtract(1, 'month'), moment().subtract(1, 'year')]
    return <CommentsListMeta>
      <Typography
        variant="body1"
        color="textSecondary"
        component='span'
        className={classes.inline}>
        {
          (commentCount < totalComments) ?
            <span>
              Rendering {commentCount}/{totalComments} comments, sorted by <Components.CommentsViews post={this.props.post} />
              {loadingMoreComments ? <Components.Loading /> : <a onClick={() => loadMoreComments({limit: commentCount + (loadMoreCount || commentCount)})}> (show more) </a>}
            </span> :
            <span>
              { totalComments } comments, sorted by <Components.CommentsViews post={this.props.post} />
            </span>
        }
      </Typography>
      <Typography
        variant="body1"
        color="textSecondary"
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
          {currentUser && <Components.LastVisitList
            terms={{view: "postVisits", limit: 4, postId: post._id, userId: currentUser._id}}
            clickCallback={this.handleDateChange}/>}
          <Divider />
          {suggestedHighlightDates.map(date => {
            return <MenuItem key={date.toString()} onClick={() => this.handleDateChange(date)}>
              {date.calendar().toString()}
            </MenuItem>
          })}
        </Menu>
      </Typography>
    </CommentsListMeta>
  }

  render() {
    const { currentUser, comments, post, classes, totalComments, parentAnswerId, startThreadTruncated, newForm=true, guidelines=true } = this.props;
    // TODO: Update "author has blocked you" message to include link to moderation guidelines (both author and LW)

    return (
      <div className={classes.root}>
        {guidelines && <div className={classes.moderationGuidelinesWrapper}>
          <Components.ModerationGuidelinesBox documentId={post._id} showModeratorAssistance />
        </div>}
        { this.props.totalComments ? this.renderTitleComponent() : null }
        <div id="comments"/>

        {newForm && (!currentUser || Users.isAllowedToComment(currentUser, post)) &&
          <div id="posts-thread-new-comment" className={classes.newComment}>
            <div className={classes.newCommentLabel}><FormattedMessage id="comments.new"/></div>
            <Components.CommentsNewForm
              post={post}
              prefilledProps={{
                parentAnswerId: parentAnswerId}}
              type="comment"
            />
          </div>
        }
        {currentUser && !Users.isAllowedToComment(currentUser, post) &&
          <Components.CantCommentExplanation post={post}/>
        }
        <Components.CommentsList
          currentUser={currentUser}
          totalComments={totalComments}
          comments={comments}
          highlightDate={this.state.highlightDate}
          post={post}
          postPage
          startThreadTruncated={startThreadTruncated}
          parentAnswerId={parentAnswerId}
        />
      </div>
    );
  }
}

registerComponent("CommentsListSection", CommentsListSection,
  withUser,
  withStyles(styles, { name: "CommentsListSection" })
);
export default CommentsListSection
