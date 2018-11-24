import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router'
import { Components, registerComponent } from 'meteor/vulcan:core';
import moment from 'moment';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Divider from '@material-ui/core/Divider';
import withUser from '../common/withUser';

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
    const { currentUser, comments, postId, post, totalComments } = this.props;
    const { ModerationGuidelinesBox, CommentsList, CommentsNewWrapper } = Components;

    // TODO: Update "author has blocked you" message to include link to moderation guidelines (both author and LW)

    return (
      <div className="posts-comments-thread">
        { this.props.totalComments ? this.renderTitleComponent() : null }
        <ModerationGuidelinesBox documentId={this.props.post._id} showModeratorAssistance />
        <CommentsList
          currentUser={currentUser}
          totalComments={totalComments}
          comments={comments}
          highlightDate={this.state.highlightDate}
          post={post}
          postPage
        />
        <CommentsNewWrapper post={post} postId={postId} />
      </div>
    );
  }
}

registerComponent("CommentsListSection", CommentsListSection,
  withUser, withRouter,
  withStyles(styles, { name: "CommentsListSection" })
);
export default CommentsListSection
