import React, { CSSProperties, useRef, useState } from 'react'
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import { useCurrentUser } from '../../common/withUser';
import { useTracking } from '../../../lib/analyticsEvents';
import { PopperPlacementType } from '@material-ui/core/Popper';
import { useIsAboveBreakpoint } from '../../hooks/useScreenWidth';
import { isFriendlyUI } from '../../../themes/forumTheme';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    cursor: "pointer"
  },
  icon: {
    verticalAlign: 'middle',
    color: isFriendlyUI ? theme.palette.grey[400] : undefined,
    cursor: "pointer",
  },
  popper: {
    position: "relative",
    zIndex: theme.zIndexes.postItemMenu
  },
})

const PostActionsButton = ({post, vertical, popperGap, autoPlace, flip, includeBookmark=true, classes}: {
  post: PostsList|SunshinePostsList,
  vertical?: boolean,
  popperGap?: number,
  autoPlace?: boolean,
  flip?: boolean,
  includeBookmark?: boolean,
  classes: ClassesType,
}) => {
  const anchorEl = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const {captureEvent} = useTracking();
  const currentUser = useCurrentUser();

  // This is fine with SSR because the popper will only be rendered after use
  // interaction
  const isDesktopWatched = useIsAboveBreakpoint('xl');

  const popperPlacement: PopperPlacementType = isDesktopWatched || !autoPlace
    ? 'right-start'
    : 'left-start';
  let gapStyle: CSSProperties | undefined
  if (popperGap) {
    switch (popperPlacement) {
      case 'right-start':
        gapStyle = {marginLeft: popperGap}
        break;
      case 'left-start':
        gapStyle = {marginRight: popperGap}
        break;
    }
  }

  const handleSetOpen = (open: boolean) => {
    captureEvent("tripleDotClick", {open, itemType: "post", postId: post._id})
    setIsOpen(open);
  }

  const Icon = vertical ? MoreVertIcon : MoreHorizIcon
  const { PopperCard, PostActions, LWClickAwayListener } = Components

  return <div className={classes.root}>
    <div ref={anchorEl}>
      <Icon className={classes.icon} onClick={(ev) => handleSetOpen(!isOpen)}/>
    </div>
    <PopperCard
      open={isOpen}
      anchorEl={anchorEl.current}
      placement={popperPlacement}
      allowOverflow
      flip={flip}
      style={gapStyle}
    >
      {/*FIXME: ClickAwayListener doesn't handle portals correctly, which winds up making submenus inoperable. But we do still need clickaway to close.*/}
      <LWClickAwayListener onClickAway={() => handleSetOpen(false)}>
        <PostActions post={post} closeMenu={() => handleSetOpen(false)} includeBookmark={includeBookmark} />
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
