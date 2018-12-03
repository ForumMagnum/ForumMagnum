import {
  Components,
  registerComponent,
} from 'meteor/vulcan:core';
import React, { Component } from 'react';
import Users from "meteor/vulcan:users";
import withUser from '../common/withUser';
import { withStyles } from '@material-ui/core/styles';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';

const styles = theme => ({
  root: {
    minHeight:75,
    "@media print": {
      display: "none"
    },
    '&:hover $actions': {
      display:"block"
    }
  },
  actionsIcon: {
    color: theme.palette.grey[400]
  },
  actions: {
    display: "none",
  }
})

const DefaultContainerElement = ({children}) => <a>
  {children}
</a>

class PostsPageAdminActions extends Component {
  showAdminActions = () => {
    const { currentUser, post } = this.props
    return Users.canDo(currentUser, "posts.edit.all") ||
      Users.canMakeAlignmentPost(currentUser, post) ||
      Users.canSuggestPostForAlignment({currentUser, post})
  }

  render() {
    const { post, classes, containerElement = DefaultContainerElement} = this.props
    const Container = containerElement
    if (post && this.showAdminActions()) {
      return (
          <div className={classes.root}>
            <MoreHorizIcon className={classes.actionsIcon}/>
            <div className={classes.actions}>
              <Components.PostActions Container={Container} post={post}/>
            </div>
          </div>
      )
    } else {
      return null
    }
  }
}

PostsPageAdminActions.displayName = "PostsPageAdminActions";

registerComponent(
  'PostsPageAdminActions',
  PostsPageAdminActions,
  withUser,
  withStyles(styles, {name: "PostsPageAdminActions"})
);
