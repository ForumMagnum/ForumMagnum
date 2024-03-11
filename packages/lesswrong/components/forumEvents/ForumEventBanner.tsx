import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useCurrentForumEvent } from "../hooks/useCurrentForumEvent";
import { useLocation } from "../../lib/routeUtil";

type BannerType = "frontpage" | "postpage";

const bannerTypes: Record<string, BannerType> = {
  "home": "frontpage",
  "posts.single": "postpage",
};

export const ForumEventBanner = () => {
  const {currentRoute} = useLocation();
  const {currentForumEvent} = useCurrentForumEvent();
  if (!currentForumEvent) {
    return null;
  }

  const bannerType = bannerTypes[currentRoute?.name ?? ""];

  const {ForumEventFrontpageBanner, ForumEventPostPageBanner} = Components;
  switch (bannerType) {
  case "frontpage":
    return (
      <ForumEventFrontpageBanner />
    );
  case "postpage":
    return (
      <ForumEventPostPageBanner />
    );
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
