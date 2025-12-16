import React, { CSSProperties, useRef, useState } from 'react'
import { registerComponent } from '../../../lib/vulcan-lib/components';
import MoreHorizIcon from '@/lib/vendor/@material-ui/icons/src/MoreHoriz';
import MoreVertIcon from '@/lib/vendor/@material-ui/icons/src/MoreVert';
import { useTracking } from '../../../lib/analyticsEvents';
import type { Placement as PopperPlacementType } from "popper.js"
import { useIsAboveBreakpoint } from '../../hooks/useScreenWidth';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import PopperCard from "../../common/PopperCard";
import PostActions from "./PostActions";
import LWClickAwayListener from "../../common/LWClickAwayListener";
import { FeedPostMetaInfo } from '../../ultraFeed/ultraFeedTypes';

const styles = defineStyles("PostActionsButton", (theme: ThemeType) => ({
  root: {
    cursor: "pointer",
    "@media print": {
      display: "none",
    },
  },
  icon: {
    verticalAlign: 'middle',
    color: theme.isFriendlyUI ? theme.palette.grey[400] : undefined,
    cursor: "pointer",
  },
  popper: {
    position: "relative",
    zIndex: theme.zIndexes.postItemMenu
  },
}));

interface PostActionsComponentProps {
  post: PostsList | SunshinePostsList;
  closeMenu: () => void;
  includeBookmark?: boolean;
  onSeeLess?: () => void;
  isSeeLessMode?: boolean;
  postMetaInfo?: FeedPostMetaInfo;
}

const PostActionsButton = ({post, vertical, popperGap, autoPlace, flip, includeBookmark=true, onSeeLess, isSeeLessMode, className, iconClassName, ActionsComponent, postMetaInfo}: {
  post: PostsList|SunshinePostsList,
  vertical?: boolean,
  popperGap?: number,
  autoPlace?: boolean,
  flip?: boolean,
  includeBookmark?: boolean,
  onSeeLess?: () => void;
  isSeeLessMode?: boolean;
  className?: string,
  iconClassName?: string,
  ActionsComponent?: React.ComponentType<PostActionsComponentProps>,
  postMetaInfo?: FeedPostMetaInfo,
}) => {
  const classes = useStyles(styles);
  const anchorEl = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const {captureEvent} = useTracking();

  // This is fine with SSR because the popper will only be rendered after use
  // interaction
  const isDesktop = useIsAboveBreakpoint('xl');
  const isMobile = !useIsAboveBreakpoint('sm');

  // On mobile, use 'bottom-start' which works better when the button is
  // in the middle of the screen. CSS anchor positioning will flip to 'top-start'
  // if there's not enough space below.
  // On tablet (sm to xl), use left-start when autoPlace is enabled.
  // On desktop (xl+), always use right-start.
  const popperPlacement: PopperPlacementType = 
    isMobile ? 'bottom-start' :
    (isDesktop || !autoPlace) ? 'right-start' : 'left-start';
    
  let gapStyle: CSSProperties | undefined
  if (popperGap) {
    switch (popperPlacement) {
      case 'right-start':
        gapStyle = {marginLeft: popperGap}
        break;
      case 'left-start':
        gapStyle = {marginRight: popperGap}
        break;
      case 'bottom-start':
        gapStyle = {marginTop: popperGap}
        break;
    }
  }

  const handleSetOpen = (open: boolean) => {
    captureEvent("tripleDotClick", {open, itemType: "post", postId: post._id})
    setIsOpen(open);
  }

  const Icon = vertical ? MoreVertIcon : MoreHorizIcon
  const MenuComponent = ActionsComponent ?? PostActions;
  return <div className={classNames(classes.root, className)}>
    <div ref={anchorEl}>
      <Icon className={classNames(classes.icon, iconClassName)} onClick={(ev: React.MouseEvent) => handleSetOpen(!isOpen)}/>
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
        <MenuComponent post={post} closeMenu={() => handleSetOpen(false)} includeBookmark={includeBookmark} onSeeLess={onSeeLess} isSeeLessMode={isSeeLessMode} postMetaInfo={postMetaInfo} />
      </LWClickAwayListener>
    </PopperCard>
  </div>
}


export default registerComponent('PostActionsButton', PostActionsButton);



