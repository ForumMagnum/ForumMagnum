import React, { useRef, useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import withErrorBoundary from '../common/withErrorBoundary';
import classNames from 'classnames';
import { useTracking } from '../../lib/analyticsEvents';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { isMobile } from '@/lib/utils/isMobile';
import { LWTooltip } from "../common/LWTooltip";
import { ForumIcon } from "../common/ForumIcon";
import { PopperCard } from "../common/PopperCard";
import { LWClickAwayListener } from "../common/LWClickAwayListener";
import { SharePostActions } from "../dropdowns/posts/SharePostActions";

const styles = (theme: ThemeType) => ({
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
})

const SharePostButtonInner = ({
  post,
  className,
  classes,
}: {
  post: PostsBase,
  className?: string,
  classes: ClassesType<typeof styles>,
}) => {
  const anchorEl = useRef<HTMLDivElement | null>(null)
  const [isOpen, setIsOpen] = useState<boolean>(false)
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
        <SharePostActions post={post} onClick={() => setIsOpen(false)} />
      </LWClickAwayListener>
    </PopperCard>
  </div>
}

export const SharePostButton = registerComponent('SharePostButton', SharePostButtonInner, {
  styles,
  hocs: [withErrorBoundary],
});

declare global {
  interface ComponentTypes {
    SharePostButton: typeof SharePostButton
  }
}
