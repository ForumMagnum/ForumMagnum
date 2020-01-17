import React, { PureComponent } from 'react'
import { withStyles } from '@material-ui/core/styles';
import { registerComponent, Components } from 'meteor/vulcan:core';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import withUser from '../../common/withUser';
import { withTracking } from '../../../lib/analyticsEvents';
import ClickawayListener from '@material-ui/core/ClickAwayListener';

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
    const { captureEvent, post } = this.props
    captureEvent("tripleDotClick", {open: true, itemType: "post", postId: post._id})
    this.setState({anchorEl: anchorEl ? null : e.target})
  }

  handleClose = (e) => {
    this.props.captureEvent("tripleDotClick", {open: false, itemType: "post"})
    this.setState({anchorEl: null})
  }

  render() {
    const { classes, post, currentUser, vertical } = this.props 
    const { anchorEl } = this.state 
    const Icon = vertical ? MoreVertIcon : MoreHorizIcon
    const { PopperCard, PostActions } = Components
    if (!currentUser) return null;

    return (
      <ClickawayListener onClickAway={this.handleClose}>
        <div>
          <Icon className={classes.icon} onClick={this.handleClick}/> 
          <PopperCard
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
            <PostActions post={post}/>
          </PopperCard>
        </div>
      </ClickawayListener>
    )
  }
}


registerComponent('PostsPageActions', PostsPageActions,
  withStyles(styles, {name: "PostsPageActions"}),
  withUser,
  withTracking
)
