import React, { PureComponent } from 'react'
import { withStyles } from '@material-ui/core/styles';
import { registerComponent, Components } from 'meteor/vulcan:core';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import Popover from '@material-ui/core/Popover';
import MenuItem from '@material-ui/core/MenuItem';
import { Posts } from '../../../lib/collections/posts';
import Users from 'meteor/vulcan:users'
import withUser from '../../common/withUser'

const styles = theme => ({
  icon: {
    verticalAlign: 'bottom'
  },
  popper: {
    position: "relative",
    zIndex: theme.zIndexes.postItemMenu
  },
})

const showPostActions = (currentUser, post) => {
  return Users.canDo(currentUser, "posts.edit.all") ||
    Users.canMakeAlignmentPost(currentUser, post) ||
    Users.canSuggestPostForAlignment({currentUser, post}) ||
    Posts.canEdit(currentUser, post)
}

class PostsPageActions extends PureComponent {
  state = { anchorEl: null }

  handleClick = (e) => {
    const { anchorEl } = this.state
    this.setState({anchorEl: anchorEl ? null : e.target})
  }

  handleClose = (e) => {
    this.setState({anchorEl: null})
  }

  render() {
    const { classes, post, currentUser, vertical } = this.props 
    const { anchorEl } = this.state 
    const Icon = vertical ? MoreVertIcon : MoreHorizIcon
  
    if (!showPostActions(currentUser, post)) return null

    return (
      <span>
        <Icon className={classes.icon} onClick={this.handleClick}/> 
        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          anchorOrigin={{horizontal: 'left', vertical: 'top'}}
          onClose={this.handleClose}
        >
          <Components.PostActions Container={MenuItem} post={post}/>
        </Popover>
      </span>
    )
  }
}


registerComponent('PostsPageActions', PostsPageActions,
  withStyles(styles, {name: "PostsPageActions"}),
  withUser
)
