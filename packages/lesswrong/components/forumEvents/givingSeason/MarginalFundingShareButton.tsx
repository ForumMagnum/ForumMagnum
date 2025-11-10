import React, { useCallback, useRef, useState } from "react";
import { registerComponent } from "@/lib/vulcan-lib/components";
import { defineStyles, useStyles } from "../../hooks/useStyles";
import { useTracking } from "@/lib/analyticsEvents";
import { useMessages } from "../../common/withMessages";
import { makeAbsolute } from "@/lib/vulcan-lib/utils";
import { isMobile } from "@/lib/utils/isMobile";
import { Paper } from "../../widgets/Paper";
import ForumIcon from "../../common/ForumIcon";
import PopperCard from "../../common/PopperCard";
import DropdownMenu from "../../dropdowns/DropdownMenu";
import DropdownItem from "../../dropdowns/DropdownItem";
import SocialMediaIcon from "../../icons/SocialMediaIcon";
import DropdownDivider from "../../dropdowns/DropdownDivider";
import LWClickAwayListener from "../../common/LWClickAwayListener";

const styles = defineStyles("MarginalFundingShareButton", (theme) => ({
  icon: {
    width: 20,
    height: 20,
    fill: theme.palette.text.primary,
  },
}));

export const MarginalFundingShareButton = ({className}: {
  className?: string,
}) => {
  const {flash} = useMessages();
  const anchorEl = useRef<HTMLButtonElement>(null);
  const [shareIsOpen, setShareIsOpen] = useState(false);
  const {captureEvent} = useTracking()

  const sharingUrl = useCallback((source: string) => {
    return makeAbsolute(`/marginal-funding?utm_campaign=marginal_funding&utm_source=${source}`);
  }, []);

  const onShare = useCallback(() => {
    captureEvent("marginalFundingShareClick");
    if (isMobile() && !!navigator.canShare) {
      const sharingOptions = {
        title: "Marginal Funding | EA Forum",
        url: sharingUrl("link"),
      };
      if (navigator.canShare(sharingOptions)) {
        void navigator.share(sharingOptions);
        return;
      }
    }
    setShareIsOpen((isOpen) => !isOpen);
  }, [captureEvent, sharingUrl]);

  const onCloseShare = useCallback(() => setShareIsOpen(false), []);

  const copyLink = useCallback(() => {
    captureEvent("shareMarginalFunding", {option: "copyLink"})
    void navigator.clipboard?.writeText(sharingUrl("link"));
    flash("Link copied to clipboard");
  }, [captureEvent, flash, sharingUrl]);

  const shareToX = useCallback(() => {
    captureEvent("shareMarginalFunding", {option: "x"});
    const tweetText = `Marginal Funding Week ${sharingUrl("x")}`;
    const destinationUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(destinationUrl, "_blank");
  }, [captureEvent, sharingUrl]);

  const shareToFacebook = useCallback(() => {
    captureEvent("shareMarginalFunding", {option: "facebook"});
    const linkTitle = "Marginal Funding Week";
    const destinationUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(sharingUrl("facebook"))}&t=${encodeURIComponent(linkTitle)}`;
    window.open(destinationUrl, "_blank");
  }, [captureEvent, sharingUrl]);

  const shareToLinkedIn = useCallback(() => {
    captureEvent("shareMarginalFunding", {option: "linkedIn"});
    const destinationUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(sharingUrl("linkedin"))}`;
    window.open(destinationUrl, "_blank");
  }, [captureEvent, sharingUrl]);

  const classes = useStyles(styles);
  return (
    <>
      <button onClick={onShare} ref={anchorEl} className={className}>
        <ForumIcon icon="Share" /> Share
      </button>
      <PopperCard
        open={shareIsOpen}
        anchorEl={anchorEl.current}
        placement="bottom-start"
        allowOverflow
      >
        <LWClickAwayListener onClickAway={onCloseShare}>
          <Paper>
            <DropdownMenu>
              <DropdownItem
                title="Copy link"
                icon="Link"
                onClick={copyLink}
              />
              <DropdownDivider />
              <DropdownItem
                title="Share on X"
                icon={() => (
                  <SocialMediaIcon className={classes.icon} name="twitter" />
                )}
                onClick={shareToX}
              />
              <DropdownItem
                title="Share on Facebook"
                icon={() => (
                  <SocialMediaIcon className={classes.icon} name="facebook" />
                )}
                onClick={shareToFacebook}
              />
              <DropdownItem
                title="Share on LinkedIn"
                icon={() => (
                  <SocialMediaIcon className={classes.icon} name="linkedin" />
                )}
                onClick={shareToLinkedIn}
              />
            </DropdownMenu>
          </Paper>
        </LWClickAwayListener>
      </PopperCard>
    </>
  );
}

export default registerComponent(
  "MarginalFundingShareButton",
  MarginalFundingShareButton,
);
