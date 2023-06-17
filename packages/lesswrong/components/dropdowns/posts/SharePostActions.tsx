import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { postGetPageUrl } from '../../../lib/collections/posts/helpers';
import { forumTitleSetting, isEAForum } from '../../../lib/instanceSettings';
import { useMessages } from '../../common/withMessages';
import { preferredHeadingCase } from '../../../lib/forumTypeUtils';
import Paper from '@material-ui/core/Paper';

const styles = (theme: ThemeType): JssStyles => ({
  icon: {
    height: 20,
    fill: "currentColor",
  },
})

const SharePostActions = ({post, classes}: {
  post: PostsBase,
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

  return <Paper>
    <DropdownMenu className={classes.root} >
      <DropdownItem
        title={preferredHeadingCase("Copy Link")}
        icon="Link"
        onClick={copyLink}
      />
      <DropdownDivider/>
      <DropdownItem
        title={isEAForum ? "Share on Twitter" : "Twitter"}
        icon={() => <SocialMediaIcon className={classes.icon} name="twitter"/>}
        onClick={shareToTwitter}
      />
      <DropdownItem
        title={isEAForum ? "Share on Facebook" : "Facebook"}
        icon={() => <SocialMediaIcon className={classes.icon} name="facebook"/>}
        onClick={shareToFacebook}
      />
      <DropdownItem
        title={isEAForum ? "Share on LinkedIn" : "LinkedIn"}
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


