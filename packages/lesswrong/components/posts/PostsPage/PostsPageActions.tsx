import React, { useState } from 'react'
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import { useCurrentUser } from '../../common/withUser';
import { useTracking } from '../../../lib/analyticsEvents';
import ClickawayListener from '@material-ui/core/ClickAwayListener';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    cursor: "pointer"
  },
  icon: {
    verticalAlign: 'middle',
    cursor: "pointer",
  },
  popper: {
    position: "relative",
    zIndex: theme.zIndexes.postItemMenu
  },
})

const PostsPageActions = ({post, vertical, classes}: {
  post: PostsList,
  vertical?: boolean,
  classes: ClassesType,
}) => {
  const [anchorEl, setAnchorEl] = useState<any>(null);
  const {captureEvent} = useTracking();
  const currentUser = useCurrentUser();

  const handleClick = (e) => {
    captureEvent("tripleDotClick", {open: true, itemType: "post", postId: post._id})
    setAnchorEl(anchorEl ? null : e.target);
  }

  const handleClose = () => {
    captureEvent("tripleDotClick", {open: false, itemType: "post"})
    setAnchorEl(null);
  }

  const Icon = vertical ? MoreVertIcon : MoreHorizIcon
  const { PopperCard, PostActions } = Components
  if (!currentUser) return null;

  return <div className={classes.root}>
    <Icon className={classes.icon} onClick={handleClick}/> 
    <PopperCard
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      placement="right-start"
      allowOverflow      
    >
      <ClickawayListener onClickAway={handleClose}>
        <PostActions post={post} closeMenu={handleClose}/>
      </ClickawayListener>
    </PopperCard>
  </div>
}


const PostsPageActionsComponent = registerComponent('PostsPageActions', PostsPageActions, {styles});

declare global {
  interface ComponentTypes {
    PostsPageActions: typeof PostsPageActionsComponent
  }
}
