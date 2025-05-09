import React, { CSSProperties } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { useLocation } from "../../lib/routeUtil";
import { hasForumEvents } from "../../lib/betas";
import { useCurrentAndRecentForumEvents } from "../hooks/useCurrentForumEvent";

type BannerType = "frontpage" | "postpage";

const bannerTypes: Record<string, BannerType> = {
  "home": "frontpage",
  "posts.single": "postpage",
};

export const ForumEventBanner = () => {
  const {currentRoute} = useLocation();
  const bannerType = bannerTypes[currentRoute?.name ?? ""];
  const {ForumEventFrontpageBanner, ForumEventPostPageBanner} = Components;
  const {currentForumEvent} = useCurrentAndRecentForumEvents();
  
  if (!hasForumEvents) {
    return null;
  }

  if (!currentForumEvent) {
    return null;
  }

  const {darkColor, lightColor, bannerTextColor} = currentForumEvent;

  // Define background color with a CSS variable to be accessed in the styles
  const style = {
    "--forum-event-background": darkColor,
    "--forum-event-foreground": lightColor,
    "--forum-event-banner-text": bannerTextColor
  } as CSSProperties;

  const wrapWithStyles = (content: React.JSX.Element) => <span style={style}>{content}</span>;

  switch (bannerType) {
    case "frontpage":
      return wrapWithStyles(<ForumEventFrontpageBanner />);
    case "postpage":
      return wrapWithStyles(<ForumEventPostPageBanner />);
    default:
      return null;
  }
}

const ForumEventBannerComponent = registerComponent(
  "ForumEventBanner",
  ForumEventBanner,
);

declare global {
  interface ComponentTypes {
    ForumEventBanner: typeof ForumEventBannerComponent
  }
}
