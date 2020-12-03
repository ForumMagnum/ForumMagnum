import React, { PureComponent } from 'react'
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import withUser from '../../common/withUser';
import { withTracking } from '../../../lib/analyticsEvents';
import ClickawayListener from '@material-ui/core/ClickAwayListener';

const styles = (theme: ThemeType): JssStyles => ({
  icon: {
    verticalAlign: 'middle'
  },
  popper: {
    position: "relative",
    zIndex: theme.zIndexes.postItemMenu
  },
})

interface ExternalProps {
  post: PostsList,
  vertical?: boolean,
}
interface PostsPageActionsProps extends ExternalProps, WithUserProps, WithTrackingProps, WithStylesProps {
}
interface PostsPageActionsState {
  anchorEl: any,
}

class PostsPageActions extends PureComponent<PostsPageActionsProps,PostsPageActionsState> {
  state: PostsPageActionsState = { anchorEl: null }

  handleClick = (e) => {
    const { anchorEl } = this.state
    const { captureEvent, post } = this.props
    captureEvent("tripleDotClick", {open: true, itemType: "post", postId: post._id})
    this.setState({anchorEl: anchorEl ? null : e.target})
  }

  handleClose = () => {
    if (!this.state.anchorEl) return
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
            <ClickawayListener onClickAway={this.handleClose}>
              <PostActions post={post} closeMenu={this.handleClose}/>
            </ClickawayListener>
          </PopperCard>
        </div>
    )
  }
}


const PostsPageActionsComponent = registerComponent<ExternalProps>('PostsPageActions', PostsPageActions, {
  styles,
  hocs: [withUser, withTracking]
});

declare global {
  interface ComponentTypes {
    PostsPageActions: typeof PostsPageActionsComponent
  }
}
