import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { postGetPageUrl } from '../../../lib/collections/posts/helpers';
import { forumTitleSetting } from '../../../lib/instanceSettings';
import { useMessages } from '../../common/withMessages';

const styles = (theme: ThemeType): JssStyles => ({
  icon: {
    height: 20,
    fill: "currentColor",
  },
})

const SharePostActions = ({post, classes}: {
  post: PostsListBase,
  classes: ClassesType,
}) => {
  const { DropdownMenu, DropdownItem, DropdownDivider, SocialMediaIcon } = Components;
  const postUrl = postGetPageUrl(post, true);
  const { flash } = useMessages();
  
  const copyLink = () => {
    void navigator.clipboard.writeText(postUrl);
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
      icon={() => <SocialMediaIcon className={classes.icon} name="twitter"/>}
      onClick={shareToTwitter}
    />
    <DropdownItem
      title="Facebook"
      icon={() => <SocialMediaIcon className={classes.icon} name="facebook"/>}
      onClick={shareToFacebook}
    />
    <DropdownItem
      title="LinkedIn"
      icon={() => <SocialMediaIcon className={classes.icon} name="linkedin"/>}
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


