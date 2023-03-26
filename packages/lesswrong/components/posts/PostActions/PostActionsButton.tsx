import React, { useRef, useState } from 'react'
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import { useCurrentUser } from '../../common/withUser';
import { useTracking } from '../../../lib/analyticsEvents';
import { isEAForum } from '../../../lib/instanceSettings';

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

const PostActionsButton = ({post, vertical, classes}: {
  post: PostsList|SunshinePostsList,
  vertical?: boolean,
  classes: ClassesType,
}) => {
  const anchorEl = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const {captureEvent} = useTracking();
  const currentUser = useCurrentUser();

  const handleSetOpen = (open: boolean) => {
    captureEvent("tripleDotClick", {open, itemType: "post", postId: post._id})
    setIsOpen(open);
  }

  const Icon = vertical ? MoreVertIcon : MoreHorizIcon
  const { PopperCard, PostActions, LWClickAwayListener } = Components
  if (!currentUser) return null;

  const placement = isEAForum ? "left-start" : "right-start";

  return <div className={classes.root}>
    <div ref={anchorEl}>
      <Icon className={classes.icon} onClick={() => handleSetOpen(!isOpen)}/>
    </div>
    <PopperCard
      open={isOpen}
      anchorEl={anchorEl.current}
      placement={placement}
      allowOverflow
    >
      {/*FIXME: ClickAwayListener doesn't handle portals correctly, which winds up making submenus inoperable. But we do still need clickaway to close.*/}
      <LWClickAwayListener onClickAway={() => handleSetOpen(false)}>
        <PostActions post={post} closeMenu={() => handleSetOpen(false)}/>
      </LWClickAwayListener>
    </PopperCard>
  </div>
}


const PostActionsButtonComponent = registerComponent('PostActionsButton', PostActionsButton, {styles});

declare global {
  interface ComponentTypes {
    PostActionsButton: typeof PostActionsButtonComponent
  }
}
