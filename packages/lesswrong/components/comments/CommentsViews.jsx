import { registerComponent, getSetting } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withLocation, withNavigation } from '../../lib/routeUtil.js';
import Users from 'meteor/vulcan:users';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { Comments } from '../../lib/collections/comments'
import { withStyles } from '@material-ui/core/styles';
import withUser from '../common/withUser';
import qs from 'qs'

const viewNames = {
  'postCommentsTop': 'top scoring',
  'postCommentsNew': 'newest',
  'postCommentsOld': 'oldest',
  'postCommentsBest': 'highest karma',
  'postCommentsDeleted': 'deleted',
  'postCommentsSpam': 'spam',
  'postCommentsReported': 'reported',
  'postLWComments': 'top scoring (include LW)',
}

const styles = theme => ({
  root: {
    display: 'inline'
  },
  link: {
    color: theme.palette.lwTertiary.main,
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
    const { post } = this.props;
    const { history, location } = this.props; // From withNavigation, withLocation
    const { query } = location;
    const currentQuery = _.isEmpty(query) ? {view: 'postCommentsTop'} : query
    this.setState({ anchorEl: null })
    const newQuery = {...currentQuery, view: view, postId: post ? post._id : undefined}
    history.push({...location.location, search: `?${qs.stringify(newQuery)}`})
  };

  handleClose = () => {
    this.setState({ anchorEl: null })
  }

  render() {
    const { currentUser, classes, post } = this.props
    const { query } = this.props.location;
    const { anchorEl } = this.state
    let views = ["postCommentsTop", "postCommentsNew", "postCommentsOld"]
    const adminViews = ["postCommentsDeleted", "postCommentsSpam", "postCommentsReported"]
    const afViews = ["postLWComments"]
    const currentView = query?.view || Comments.getDefaultView(post, currentUser)

    if (Users.canDo(currentUser, "comments.softRemove.all")) {
      views = views.concat(adminViews);
    }

    const af = getSetting('forumType') === 'AlignmentForum'
    if (af) {
      views = views.concat(afViews);
    }

    return (
      <div className={classes.root}>
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
  post: PropTypes.object.isRequired,
  defaultView: PropTypes.string,
};

CommentsViews.defaultProps = {
  defaultView: "postCommentsTop"
};

registerComponent('CommentsViews', CommentsViews,
  withLocation, withNavigation, withUser,
  withStyles(styles, { name: "CommentsViews" })
);
