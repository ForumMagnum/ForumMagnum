import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { useHover } from '../../common/withHover';
import { postGetPageUrl } from '../../../lib/collections/posts/helpers';
import { isServer } from '../../../lib/executionEnvironment';
import { isMobile } from '@/lib/utils/isMobile';
import { SharePostActions } from "./SharePostActions";
import { DropdownItem } from "../DropdownItem";
import { LWTooltip } from "../../common/LWTooltip";

const styles = (theme: ThemeType) => ({
})

const SharePostSubmenuInner = ({post, closeMenu, classes}: {
  post: PostsListBase,
  closeMenu?: () => void,
  classes: ClassesType<typeof styles>,
}) => {
  const { hover, eventHandlers } = useHover();
  
  function shareClicked() {
    // navigator.canShare will be present on mobile devices with sharing-intents,
    // absent on desktop.
    if (isMobile() && !!navigator.canShare?.()) {
      const sharingOptions = {
        title: post.title,
        text: post.title,
        url: postGetPageUrl(post),
      };
      if (navigator.canShare(sharingOptions)) {
        void navigator.share(sharingOptions);
      }
    } else {
      // If navigator.canShare is missing, do nothing
    }
  }
  
  const hasSubmenu = isServer || !navigator.canShare?.();
  const MaybeWrapWithSubmenu = hasSubmenu
    ? ({children}: {children: React.ReactNode}) => <LWTooltip
        title={<SharePostActions post={post} onClick={closeMenu} />}
        tooltip={false} clickable inlineBlock={false}
        placement="left-start"
      >
        {children}
      </LWTooltip>
    : ({children}: {children: React.ReactNode}) => <>
        {children}
      </>
  
  return <div {...eventHandlers}>
    <MaybeWrapWithSubmenu>
      <DropdownItem
        onClick={shareClicked}
        icon="Share"
        title="Share"
      />
    </MaybeWrapWithSubmenu>
  </div>
}
export const SharePostSubmenu = registerComponent('SharePostSubmenu', SharePostSubmenuInner, {styles});

