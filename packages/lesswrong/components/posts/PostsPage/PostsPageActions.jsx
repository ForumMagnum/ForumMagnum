import React, { PureComponent } from 'react'
import { withStyles } from '@material-ui/core/styles';
import { registerComponent, Components } from 'meteor/vulcan:core';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import Popper from '@material-ui/core/Popper';
import Paper from '@material-ui/core/Paper';
import MenuItem from '@material-ui/core/MenuItem';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
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
    if (this.state.anchorEl) {
      this.setState((prevState) => ({anchorEl: null}))
    } else {
      this.setState({anchorEl: e.target})
    }
  }

  handleClickAway = (e) => {
    // TODO – figure out why the prevent / stop thingies aren't working
    e.stopPropagation()
    e.preventDefault()
    this.setState({anchorEl: null})
  }

  render() {
    const {classes, post, currentUser, vertical, menuClassName} = this.props 
    const { anchorEl } = this.state 

    if (showPostActions(currentUser, post)) {
      return <span>
        {vertical ? 
          <MoreVertIcon className={classes.icon} onClick={this.handleClick}/> 
          : 
          <MoreHorizIcon className={classes.icon} onClick={this.handleClick}/>
        }
        <Popper
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          placement="top-start"
          className={classes.popper}
        >
          <ClickAwayListener onClickAway={this.handleClickAway} >
            <Paper className={menuClassName}>
              <Components.PostActions Container={MenuItem} post={post}/>
            </Paper>
          </ClickAwayListener>
        </Popper>
      </span>
    } else {
      return null
    }
  }
}


registerComponent('PostsPageActions', PostsPageActions,
  withStyles(styles, {name: "PostsPageActions"}),
  withUser
)
