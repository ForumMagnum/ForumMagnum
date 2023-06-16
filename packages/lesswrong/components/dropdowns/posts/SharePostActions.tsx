import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { postGetPageUrl } from '../../../lib/collections/posts/helpers';
import { forumTitleSetting } from '../../../lib/instanceSettings';
import { useMessages } from '../../common/withMessages';

const styles = (theme: ThemeType): JssStyles => ({
})

const SharePostActions = ({post, classes}: {
  post: PostsListBase,
  classes: ClassesType,
}) => {
  const { DropdownMenu, DropdownItem, DropdownDivider } = Components;
  const postUrl = postGetPageUrl(post, true);
  const { flash } = useMessages();
  
  const copyLink = () => {
    navigator.clipboard.writeText(postUrl);
    flash("Link copied to clipboard");
  }

  const openLinkInNewTab = (url: string) => {
    window.open(url, '_blank');
  }
  
  const siteName = forumTitleSetting.get();
  const linkTitle = `${post.title} - ${siteName}`;
  
  const shareToTwitter = () => {
    const tweetText = `${linkTitle} ${postUrl}`;
    const destinationUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    openLinkInNewTab(destinationUrl);
  }
  const shareToFacebook = () => {
    const destinationUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}&t=${encodeURIComponent(linkTitle)}`;
    openLinkInNewTab(destinationUrl);
  }
  const shareToLinkedIn = () => {
    const destinationUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`;
    openLinkInNewTab(destinationUrl);
  }

  return <DropdownMenu className={classes.root} >
    <DropdownItem
      title="Copy Link"
      icon="Link"
      onClick={copyLink}
    />
    <DropdownDivider/>
    <DropdownItem
      title="Twitter"
      onClick={shareToTwitter}
    />
    <DropdownItem
      title="Facebook"
      onClick={shareToFacebook}
    />
    <DropdownItem
      title="LinkedIn"
      onClick={shareToLinkedIn}
    />
  </DropdownMenu>
}

const SharePostActionsComponent = registerComponent('SharePostActions', SharePostActions, {styles});

declare global {
  interface ComponentTypes {
    SharePostActions: typeof SharePostActionsComponent
  }
}


