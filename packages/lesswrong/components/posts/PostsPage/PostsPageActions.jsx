import React, { PureComponent } from 'react'
import { withStyles } from '@material-ui/core/styles';
import { registerComponent, Components } from 'meteor/vulcan:core';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import withUser from '../../common/withUser'
import ClickawayListener from '@material-ui/core/ClickAwayListener';
import Card from '@material-ui/core/Card';

const styles = theme => ({
  icon: {
    verticalAlign: 'bottom'
  },
  popper: {
    position: "relative",
    zIndex: theme.zIndexes.postItemMenu
  },
})

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
    const {LWPopper, PostActions } = Components
    if (!currentUser) return null;

    return (
      <ClickawayListener onClickAway={this.handleClose}>
        <Icon className={classes.icon} onClick={this.handleClick}/> 
        <LWPopper
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          placement="right-start"
          modifiers={{
            flip: {
              boundariesElement: 'viewport',
              behavior: ['right-start', 'bottom']
            }
          }}
        >
          <Card>
            <PostActions post={post}/>
          </Card>
        </LWPopper>
      </ClickawayListener>
    )
  }
}


registerComponent('PostsPageActions', PostsPageActions,
  withStyles(styles, {name: "PostsPageActions"}),
  withUser
)
