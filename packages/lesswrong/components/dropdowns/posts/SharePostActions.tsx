import { postGetPageUrl } from '../../../lib/collections/posts/helpers';
import { forumTitleSetting } from '../../../lib/instanceSettings';
import { useMessages } from '../../common/withMessages';

import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';
import { Paper } from '@/components/widgets/Paper';
import { useTracking } from '../../../lib/analyticsEvents';
import { preferredHeadingCase } from '../../../themes/forumTheme';
import SocialMediaIcon from "../../icons/SocialMediaIcon";
import DropdownDivider from "../DropdownDivider";
import DropdownItem from "../DropdownItem";
import DropdownMenu from "../DropdownMenu";

const styles = defineStyles("SharePostActions", (_theme: ThemeType) => ({
  icon: {
    height: 20,
    fill: "currentColor",
  },
}))

const SharePostActions = ({post, onClick}: {
  post: PostsBase,
  onClick?: () => void,
}) => {
  const classes = useStyles(styles);
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

  return <div onClick={onClick}><Paper>
    <DropdownMenu>
      <DropdownItem
        title={preferredHeadingCase("Copy Link")}
        icon="Link"
        onClick={copyLink}
      />
      <DropdownDivider/>
      <DropdownItem
        title={"Twitter"}
        icon={() => <SocialMediaIcon className={classes.icon} name="twitter"/>}
        onClick={shareToTwitter}
      />
      <DropdownItem
        title={"Facebook"}
        icon={() => <SocialMediaIcon className={classes.icon} name="facebook"/>}
        onClick={shareToFacebook}
      />
      <DropdownItem
        title={"LinkedIn"}
        icon={() => <SocialMediaIcon className={classes.icon} name="linkedin"/>}
        onClick={shareToLinkedIn}
      />
    </DropdownMenu>
  </Paper></div>
}

export default SharePostActions;


