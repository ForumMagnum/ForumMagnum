import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'meteor/vulcan:i18n';
import { withRouter } from 'react-router'
import {
  withCurrentUser,
  Components,
  registerComponent,
  getSetting
} from 'meteor/vulcan:core';
import moment from 'moment';
import Users from 'meteor/vulcan:users';
import { Comments } from "meteor/example-forum";
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Divider from '@material-ui/core/Divider';

const styles = theme => ({
  meta: {
    fontSize: 14,
    clear: 'both',
    overflow: 'auto',
    paddingBottom: 5,
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  inline: {
    display: 'inline'
  },
  link: {
    color: theme.palette.secondary.main,
  },
  newComment: {
    padding: '0 10px',
    border: 'solid 1px rgba(0,0,0,.2)',
    position: 'relative',
  }
})

class CommentsListSection extends Component {
  constructor(props) {
    super(props);
    this.state = {
      highlightDate: this.props.lastEvent && this.props.lastEvent.properties && this.props.lastEvent.properties.createdAt && new Date(this.props.lastEvent.properties.createdAt) || this.props.post && this.props.post.lastVisitedAt && new Date(this.props.post.lastVisitedAt) || new Date(),
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
    const { commentCount, totalComments, loadMoreComments, loadingMoreComments, post, currentUser, classes } = this.props;
    const { anchorEl, highlightDate } = this.state
    const suggestedHighlightDates = [moment().subtract(1, 'day'), moment().subtract(1, 'week'), moment().subtract(1, 'month'), moment().subtract(1, 'year')]
    return <div className={this.props.classes.meta}>
      <Typography
        variant="body2"
        color="textSecondary"
        component='span'
        className={this.props.classes.inline}>
        {
          (commentCount < totalComments) ?
            <span>
              Rendering {commentCount}/{totalComments} comments, sorted by <Components.CommentsViews post={this.props.post} />
              {loadingMoreComments ? <Components.Loading /> : <a onClick={() => loadMoreComments()}> (show more) </a>}
            </span> :
            <span>
              { totalComments } comments, sorted by <Components.CommentsViews post={this.props.post} />
            </span>
        }
      </Typography>
      <Typography
        variant="body2"
        color="textSecondary"
        component='span'
        className={this.props.classes.inline}
      >
        Highlighting new comments since <a className={classes.link} onClick={this.handleClick}>
          {moment(highlightDate).calendar()}
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
          {suggestedHighlightDates.map((date,i) => {
            return <MenuItem key={i} onClick={() => this.handleDateChange(date)}>
              {date.calendar().toString()}
            </MenuItem>
          })}
        </Menu>
      </Typography>
    </div>
  }

  render() {
    const { currentUser, comments, postId, post, classes } = this.props;

    // TODO: Update "author has blocked you" message to include link to moderation guidelines (both author and LW)

    return (
      <div className="posts-comments-thread">
        { this.props.totalComments ? this.renderTitleComponent() : null }
        <Components.ModerationGuidelinesBox documentId={this.props.post._id} showModeratorAssistance />
        <Components.CommentsList
          currentUser={currentUser}
          comments={comments}
          highlightDate={this.state.highlightDate}
          post={post}
        />
        {!currentUser &&
          <div>
            <Components.ModalTrigger
              component={<a href="#">
                <FormattedMessage id={!(getSetting('AlignmentForum', false)) ? "comments.please_log_in" : "alignment.comments.please_log_in"}/>
              </a>} size="small">
              <Components.AccountsLoginForm/>
            </Components.ModalTrigger>
          </div>
        }
        {currentUser && Users.isAllowedToComment(currentUser, post) &&
          <div id="posts-thread-new-comment" className={classes.newComment}>
            <h4><FormattedMessage id="comments.new"/></h4>
            <Components.CommentsNewForm
              postId={postId}
              prefilledProps={{af: Comments.defaultToAlignment(currentUser, post)}}
              type="comment"
            />
          </div>
        }
        {currentUser && !Users.isAllowedToComment(currentUser, post) && (
          <div className="i18n-message author_has_banned_you">
            { Users.blockedCommentingReason(currentUser, post)}
            { !(getSetting('AlignmentForum', false)) && <span>
              (Questions? Send an email to <a className="email-link" href="mailto:moderation@lesserwrong.com">moderation@lesserwrong.com</a>)
            </span> }
          </div>
        )}
      </div>
    );
  }
}

registerComponent("CommentsListSection", CommentsListSection, withCurrentUser, withRouter, withStyles(styles));
export default CommentsListSection
