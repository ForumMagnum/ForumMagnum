import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { postGetPageUrl } from '../../../lib/collections/posts/helpers';
import { forumTitleSetting } from '../../../lib/instanceSettings';
import { useMessages } from '../../common/withMessages';

import Paper from '@material-ui/core/Paper';
import { useTracking } from '../../../lib/analyticsEvents';
import { isFriendlyUI, preferredHeadingCase } from '../../../themes/forumTheme';

const styles = (theme: ThemeType): JssStyles => ({
  icon: {
    height: 20,
    fill: "currentColor",
  },
})

const SharePostActions = ({post, onClick, classes}: {
  post: PostsBase,
  onClick?: () => void,
  classes: ClassesType,
}) => {
  const { DropdownMenu, DropdownItem, DropdownDivider, SocialMediaIcon } = Components;
  const { captureEvent } = useTracking()
  const { flash } = useMessages();
  
  const postUrl = (source: string) => `${postGetPageUrl(post, true)}?utm_campaign=post_share&utm_source=${source}`
  
  const copyLink = () => {
    captureEvent('sharePost', {option: 'copyLink'})
    void navigator.clipboard.writeText(postUrl('link'));
    flash("Link copied to clipboard");
  }

  const openLinkInNewTab = (url: string) => {
    window.open(url, '_blank');
  }
  
  const siteName = forumTitleSetting.get();
  const linkTitle = `${post.title} - ${siteName}`;
  
  const shareToTwitter = () => {
    captureEvent('sharePost', {option: 'twitter'})
    const tweetText = `${linkTitle} ${postUrl('twitter')}`;
    const destinationUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    openLinkInNewTab(destinationUrl);
  }
  const shareToFacebook = () => {
    captureEvent('sharePost', {option: 'facebook'})
    const destinationUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl('facebook'))}&t=${encodeURIComponent(linkTitle)}`;
    openLinkInNewTab(destinationUrl);
  }
  const shareToLinkedIn = () => {
    captureEvent('sharePost', {option: 'linkedIn'})
    const destinationUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl('linkedin'))}`;
    openLinkInNewTab(destinationUrl);
  }

  return <Paper onClick={onClick}>
    <DropdownMenu className={classes.root}>
      <DropdownItem
        title={preferredHeadingCase("Copy Link")}
        icon="Link"
        onClick={copyLink}
      />
      <DropdownDivider/>
      <DropdownItem
        title={isFriendlyUI ? "Share on Twitter" : "Twitter"}
        icon={() => <SocialMediaIcon className={classes.icon} name="twitter"/>}
        onClick={shareToTwitter}
      />
      <DropdownItem
        title={isFriendlyUI ? "Share on Facebook" : "Facebook"}
        icon={() => <SocialMediaIcon className={classes.icon} name="facebook"/>}
        onClick={shareToFacebook}
      />
      <DropdownItem
        title={isFriendlyUI ? "Share on LinkedIn" : "LinkedIn"}
        icon={() => <SocialMediaIcon className={classes.icon} name="linkedin"/>}
        onClick={shareToLinkedIn}
      />
    </DropdownMenu>
  </Paper>
}

const SharePostActionsComponent = registerComponent('SharePostActions', SharePostActions, {styles});

declare global {
  interface ComponentTypes {
    SharePostActions: typeof SharePostActionsComponent
  }
}
