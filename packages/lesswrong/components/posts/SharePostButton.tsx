import React, { useCallback, useRef, useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import withErrorBoundary from '../common/withErrorBoundary';
import classNames from 'classnames';
import { useTracking } from '../../lib/analyticsEvents';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { isMobile } from '@/lib/utils/isMobile';
import LWTooltip from "../common/LWTooltip";
import ForumIcon from "../common/ForumIcon";
import PopperCard from "../common/PopperCard";
import LWClickAwayListener from "../common/LWClickAwayListener";
import SharePostActions from "../dropdowns/posts/SharePostActions";
import CitePostPopover from "./CitePostPopover";
import { OpenCitePopoverContext } from "./CitePostPopoverContext";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('SharePostButton', (theme: ThemeType) => ({
  root: {
    display: "inline-block",
  },
  icon: {
    fontSize: 22,
    cursor: "pointer",
    '&:hover': {
      opacity: '0.5'
    }
  },
}))

const SharePostButton = ({post, className}: {
  post: PostsListBase,
  className?: string,
}) => {
  const classes = useStyles(styles);
  const anchorEl = useRef<HTMLDivElement | null>(null)
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [isCiteOpen, setIsCiteOpen] = useState(false);
  const openCitePopover = useCallback(() => setIsCiteOpen(true), []);
  const { captureEvent } = useTracking()
  
  const shareClicked = () => {
    captureEvent('sharePostButtonClicked')
    // navigator.canShare will be present on mobile devices with sharing-intents,
    // absent on desktop.
    if (isMobile() && !!navigator.canShare) {
      const sharingOptions = {
        title: post.title,
        text: post.title,
        url: postGetPageUrl(post),
      }
      if (navigator.canShare(sharingOptions)) {
        void navigator.share(sharingOptions)
        return
      }
    }
    setIsOpen(!isOpen)
  }
  return <div className={classes.root}>
    <div ref={anchorEl}>
      <LWTooltip title="Share post" placement="bottom-start" disabled={isOpen}>
        <ForumIcon
          icon="Share"
          className={classNames(classes.icon, className)}
          onClick={shareClicked}
        />
      </LWTooltip>
    </div>
    <PopperCard
      open={isOpen}
      anchorEl={anchorEl.current}
      placement="bottom"
      allowOverflow
    >
      <LWClickAwayListener onClickAway={() => setIsOpen(false)}>
        <OpenCitePopoverContext.Provider value={openCitePopover}>
          <SharePostActions post={post} onClick={() => setIsOpen(false)} />
        </OpenCitePopoverContext.Provider>
      </LWClickAwayListener>
    </PopperCard>
    <CitePostPopover
      post={post}
      anchorEl={anchorEl.current}
      open={isCiteOpen}
      onClose={() => setIsCiteOpen(false)}
      placement="bottom"
    />
  </div>
}

export default registerComponent('SharePostButton', SharePostButton, {
  hocs: [withErrorBoundary],
});


