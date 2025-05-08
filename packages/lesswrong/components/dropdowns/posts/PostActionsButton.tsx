import React, { CSSProperties, useRef, useState } from 'react'
import { registerComponent } from '../../../lib/vulcan-lib/components';
import MoreHorizIcon from '@/lib/vendor/@material-ui/icons/src/MoreHoriz';
import MoreVertIcon from '@/lib/vendor/@material-ui/icons/src/MoreVert';
import { useCurrentUser } from '../../common/withUser';
import { useTracking } from '../../../lib/analyticsEvents';
import type { Placement as PopperPlacementType } from "popper.js"
import { useIsAboveBreakpoint } from '../../hooks/useScreenWidth';
import { isFriendlyUI } from '../../../themes/forumTheme';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { PopperCard } from "../../common/PopperCard";
import { PostActions } from "./PostActions";
import { LWClickAwayListener } from "../../common/LWClickAwayListener";

const styles = defineStyles("PostActionsButton", (theme: ThemeType) => ({
  root: {
    cursor: "pointer",
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
}));

const PostActionsButtonInner = ({post, vertical, popperGap, autoPlace, flip, includeBookmark=true, className}: {
  post: PostsList|SunshinePostsList,
  vertical?: boolean,
  popperGap?: number,
  autoPlace?: boolean,
  flip?: boolean,
  includeBookmark?: boolean,
  className?: string,
}) => {
  const classes = useStyles(styles);
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
  return <div className={classNames(classes.root, className)}>
    <div ref={anchorEl}>
      <Icon className={classes.icon} onClick={(ev: React.MouseEvent) => handleSetOpen(!isOpen)}/>
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


export const PostActionsButton = registerComponent('PostActionsButton', PostActionsButtonInner);


declare global {
  interface ComponentTypes {
    PostActionsButton: typeof PostActionsButton
  }
}
