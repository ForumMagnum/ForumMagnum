import React, { useRef, useEffect, useCallback, useState } from "react";
import { useRerenderOnce } from "../hooks/useFirstRender";
import { postGetPageUrl } from "../../lib/collections/posts/helpers";
import { useTracking } from "../../lib/analyticsEvents";
import { useMessages } from "../common/withMessages";
import { forumTitleSetting } from "../../lib/instanceSettings";
import { getPostDescription } from "./PostsPage/PostsPage";
import { siteImageSetting } from "../vulcan-core/App";
import classNames from "classnames";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { getSiteUrl } from "../../lib/vulcan-lib/utils";
import { Typography } from "@/components/common/Typography";
import ForumIcon from "@/components/common/ForumIcon";
import SocialMediaIcon from "@/components/icons/SocialMediaIcon";
import { Popper, Paper, Button } from "@/components/mui-replacement";

const ANIMATION_DURATION = 300;

const styles = (theme: ThemeType) => ({
  popper: {
    zIndex: theme.zIndexes.loginDialog,
    borderRadius: theme.borderRadius.default,
    // The popper has its own translation applied, which
    // means we can't apply the animation to it. Remove the box
    // shadow so it isn't visible during the animation.
    boxShadow: 'none',
    '& .MuiPaper-elevation2': {
      boxShadow: "none",
    },
    [theme.breakpoints.down("md")]: {
      display: "none",
    },
  },
  root: {
    padding: "11px 16px 28px 20px",
    fontFamily: theme.palette.fonts.sansSerifStack,
    boxShadow: theme.palette.boxShadow.eaCard,
    borderRadius: theme.borderRadius.default,
    maxWidth: 380,
    animation: `animateIn ${ANIMATION_DURATION}ms ease-out`,
  },
  rootAnimateOut: {
    animation: `animateOut ${ANIMATION_DURATION}ms ease-out`,
  },
  "@keyframes animateIn": {
    "0%": {
      transform: "translateY(100%)",
      opacity: 0,
    },
    "100%": {
      transform: "translateY(0)",
      opacity: 1,
    },
  },
  "@keyframes animateOut": {
    "0%": {
      transform: "translateY(0)",
      opacity: 1,
    },
    "100%": {
      transform: "translateY(100%)",
      opacity: 0,
    },
  },
  closeButtonRow: {
    textAlign: "right",
    height: 9,
  },
  closeButton: {
    padding: 0,
    minWidth: "fit-content",
    minHeight: "fit-content",
  },
  closeIcon: {
    fontSize: 22,
    color: theme.palette.grey[600],
  },
  checkIcon: {
    color: theme.palette.icon.filledGreenCheckmark,
    width: 22,
    height: 22,
    marginRight: 10,
  },
  title: {
    display: "flex",
    alignItems: "center",
    marginBottom: 22,
    width: "fit-content",
    marginLeft: "auto",
    marginRight: "auto",
  },
  titleText: {
    color: theme.palette.grey[1000],
    fontWeight: 600,
    margin: 0,
    fontSize: 22,
  },
  sharePost: {
    margin: 0,
    fontSize: "14px",
    fontWeight: 700,
    color: theme.palette.grey[600],
    textTransform: "uppercase",
    marginBottom: 12,
  },
  image: {
    width: 78,
    height: 78,
    marginRight: 12,
    objectFit: "cover",
    borderRadius: theme.borderRadius.small,
  },
  postPreviewTextWrapper: {
    display: "flex",
    flexDirection: "column",
    height: 78,
    width: 220,
  },
  postTitle: {
    fontSize: 14,
    minHeight: 18,
    fontWeight: 700,
    marginBottom: 6,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  postPreviewText: {
    fontSize: 12,
    color: theme.palette.grey[600],
    marginBottom: 6,
    fontWeight: 500,
    display: "-webkit-box",
    "-webkit-line-clamp": 2,
    "-webkit-box-orient": "vertical",
    overflow: "hidden",
  },
  postPreviewHostname: {
    fontSize: 12,
    color: theme.palette.grey[600],
    marginTop: "auto",
    fontWeight: 500,
  },
  contentContainer: {
    display: "flex",
    border: `1px solid ${theme.palette.grey[200]}`,
    borderRadius: theme.borderRadius.default,
    padding: 12,
  },
  shareButtonIcon: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    margin: "20px 20px 8px 20px",
    width: 44,
    height: 44,
    borderRadius: "50%",
    backgroundColor: theme.palette.grey[110],
    color: theme.palette.grey[1000],
    fill: theme.palette.grey[1000],
    cursor: "pointer",
    "&:hover": {
      backgroundColor: theme.palette.grey[300],
    },
  },
  shareButtonRow: {
    display: "flex",
    justifyContent: "space-between",
  },
  shareButton: {
    display: "flex",
    flexDirection: "column",
  },
  shareButtonLabel: {
    color: theme.palette.grey[600],
    fontSize: "13px",
    textAlign: "center",
    fontWeight: 500,
  },
  icon: {
    width: 20,
    height: 20,
  },
});

type ShareButtonProps = { label: string; icon: JSX.Element; clickAction?: () => void; classes: ClassesType<typeof styles> };

const ShareButton = ({ label, icon, clickAction, classes }: ShareButtonProps) => {
  return (
    <div className={classes.shareButton}>
      <div onClick={clickAction} className={classes.shareButtonIcon}>
        {icon}
      </div>
      <div className={classes.shareButtonLabel}>{label}</div>
    </div>
  );
};

const SharePostPopup = ({
  post,
  onClose,
  classes,
}: {
  post: PostsWithNavigation | PostsWithNavigationAndRevision;
  onClose: () => void;
  classes: ClassesType<typeof styles>;
}) => {
  const anchorEl = useRef<HTMLDivElement | null>(null);
  const { captureEvent } = useTracking();
  const { flash } = useMessages();
  const [isClosing, setIsClosing] = useState(false);
  const urlHostname = new URL(getSiteUrl()).hostname;

  // Force rerender because the element we are anchoring to is created after the first render
  useRerenderOnce();

  useEffect(() => {
    // Create a fixed position element at the bottom right corner of the screen
    const fixedElement = document.createElement("div");
    fixedElement.style.position = "fixed";
    fixedElement.style.bottom = "80px"; // appear above intercom or cookie banner
    fixedElement.style.right = "16px";

    document.body.appendChild(fixedElement);
    anchorEl.current = fixedElement;

    // Remove on unmount
    return () => {
      document.body.removeChild(fixedElement);
    };
  }, []);

  const postUrl = (source: string) => `${postGetPageUrl(post, true)}?utm_campaign=publish_share&utm_source=${source}`

  const copyLink = () => {
    captureEvent("sharePost", { pageElementContext: 'sharePostPopup', postId: post._id, option: "copyLink" });
    void navigator.clipboard.writeText(postUrl('link'));
    flash("Link copied to clipboard");
  };

  const openLinkInNewTab = (url: string) => {
    window.open(url, "_blank");
  };

  const siteName = forumTitleSetting.get();
  const linkTitle = `${post.title} - ${siteName}`;

  const shareToTwitter = () => {
    captureEvent("sharePost", { pageElementContext: 'sharePostPopup', postId: post._id, option: "twitter" });
    const tweetText = `${linkTitle} ${postUrl('twitter')}`;
    const destinationUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    openLinkInNewTab(destinationUrl);
  };
  const shareToFacebook = () => {
    captureEvent("sharePost", { pageElementContext: 'sharePostPopup', postId: post._id, option: "facebook" });
    const destinationUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      postUrl('facebook')
    )}&t=${encodeURIComponent(linkTitle)}`;
    openLinkInNewTab(destinationUrl);
  };
  const shareToLinkedIn = () => {
    captureEvent("sharePost", { pageElementContext: 'sharePostPopup', postId: post._id, option: "linkedIn" });
    const destinationUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl('linkedin'))}`;
    openLinkInNewTab(destinationUrl);
  };

  const shareButtons: ShareButtonProps[] = [
    { label: "Copy link", icon: <ForumIcon icon="Link" className={classes.icon} />, clickAction: copyLink, classes },
    {
      label: "Twitter",
      icon: <SocialMediaIcon className={classes.icon} name="twitter" />,
      clickAction: shareToTwitter,
      classes,
    },
    {
      label: "Facebook",
      icon: <SocialMediaIcon className={classes.icon} name="facebook" />,
      clickAction: shareToFacebook,
      classes,
    },
    {
      label: "LinkedIn",
      icon: <SocialMediaIcon className={classes.icon} name="linkedin" />,
      clickAction: shareToLinkedIn,
      classes,
    },
  ];

  const onClickClose = useCallback(() => {
    setIsClosing(true); // Start animation

    // onClose actually unmounts the component.
    // Err on the side of unmounting early to avoid a flash of the component in the wrong position
    setTimeout(onClose, ANIMATION_DURATION * 0.9);
  }, [onClose]);

  return (
    <Popper open={true} anchorEl={anchorEl.current} placement="top-end" className={classes.popper} transition>
      <Paper>
        <div className={classNames(classes.root, {[classes.rootAnimateOut]: isClosing})}>
          <div className={classes.closeButtonRow}>
            <Button className={classes.closeButton} onClick={onClickClose}>
              <ForumIcon icon="Close" className={classes.closeIcon} />
            </Button>
          </div>
          <div className={classes.title}>
            <ForumIcon icon="CheckCircle" className={classes.checkIcon} />
            <Typography variant="title" className={classes.titleText}>
              Post published
            </Typography>
          </div>
          <div className={classes.sharePost}>Share post</div>
          <div className={classes.contentContainer}>
            <img className={classes.image} src={post.socialPreviewData.imageUrl || siteImageSetting.get()} />
            <div className={classes.postPreviewTextWrapper}>
              <div className={classes.postTitle}>{post.title}</div>
              <div className={classes.postPreviewText}>{getPostDescription(post)}</div>
              <div className={classes.postPreviewHostname}>{urlHostname}</div>
            </div>
          </div>
          <div className={classes.shareButtonRow}>
            {shareButtons.map((button, index) => (
              <ShareButton key={`shareButton_${index}`} {...button} />
            ))}
          </div>
        </div>
      </Paper>
    </Popper>
  );
};

export default SharePostPopup;

const SharePostPopupComponent = registerComponent("SharePostPopup", SharePostPopup, { styles });

declare global {
  interface ComponentTypes {
    SharePostPopup: typeof SharePostPopupComponent;
  }
}

export {
  SharePostPopupComponent as SharePostPopup
}
