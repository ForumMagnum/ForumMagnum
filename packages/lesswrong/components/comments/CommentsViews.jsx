import { Components, registerComponent, withCurrentUser } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router'
import Users from 'meteor/vulcan:users';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { withStyles } from '@material-ui/core/styles';

const viewNames = {
  'postCommentsTop': 'magical algorithm',
  'postCommentsNew': 'most recent',
  'postCommentsBest': 'highest karma',
  'postCommentsDeleted': 'deleted',
  'postCommentsSpam': 'spam',
  'postCommentsReported': 'reported',
}

const styles = theme => ({
  link: {
    color: theme.palette.secondary.main,
  }
})

class CommentsViews extends Component {
  constructor(props) {
    super(props);
    this.state = {
      anchorEl: null,
    }
  }

  handleClick = event => {
    this.setState({ anchorEl: event.currentTarget });
  };

  handleViewClick = (view) => {
    const { router, postId } = this.props
    const currentQuery = (!_.isEmpty(router.location.query) && router.location.query) ||  {view: 'postCommentsTop'}
    this.setState({ anchorEl: null })
    router.replace({...router.location, query: {...currentQuery, view: view, postId: postId}})
  };

  handleClose = () => {
    this.setState({ anchorEl: null })
  }

  render() {
    const { currentUser, router, classes } = this.props
    const { anchorEl } = this.state
    let views = ["postCommentsTop", "postCommentsNew", "postCommentsBest"]
    const adminViews = ["postCommentsDeleted", "postCommentsSpam", "postCommentsReported"]
    const currentView = _.clone(router.location.query).view || "postCommentsTop"

    if (Users.canDo(currentUser, "comments.softRemove.all")) {
      views = views.concat(adminViews);
    }

    return (
      <div className="comments-views">
        <a className={classes.link} onClick={this.handleClick}>
          {viewNames[currentView]}
        </a>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={this.handleClose}
        >
          {views.map(view => {
            return(
              <MenuItem
                key={view}
                onClick={() => this.handleViewClick(view)}
              >
                {viewNames[view]}
              </MenuItem>)})}
        </Menu>
      </div>
  )}
}

CommentsViews.propTypes = {
  currentUser: PropTypes.object,
  defaultView: PropTypes.string
};

CommentsViews.defaultProps = {
  defaultView: "postCommentsTop"
};

CommentsViews.displayName = "PostsViews";

registerComponent('CommentsViews', CommentsViews, withRouter, withCurrentUser, withStyles(styles));
