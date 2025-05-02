import React, { CSSProperties } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { useCurrentAndRecentForumEvents } from "../hooks/useCurrentForumEvent";
import { useLocation } from "../../lib/routeUtil";
import { useSingle } from "../../lib/crud/withSingle";
import { hasForumEvents } from "../../lib/betas";
import {
  forumEventBannerDescriptionStyles,
  forumEventBannerGradientBackground,
} from "./ForumEventFrontpageBanner";

const BANNER_HEIGHT = 60;

const styles = (theme: ThemeType) => ({
  root: {
    position: "relative",
    width: "100%",
    height: BANNER_HEIGHT,
    padding: "0px 30px",
    display: "flex",
    alignItems: "center",
    overflow: "hidden",
    ...forumEventBannerGradientBackground(theme),
    [theme.breakpoints.down("sm")]: {
      background: "var(--forum-event-background)",
      height: "unset",
      padding: "20px 30px",
    },
    [theme.breakpoints.down("xs")]: {
      padding: 20,
      marginTop: 8,
    },
  },
  descriptionWrapper: {
    margin: 0,
  },
  description: {
    ...forumEventBannerDescriptionStyles(),
  },
  image: {
    position: "absolute",
    zIndex: -1,
    top: "-50%",
    right: 0,
    width: "100vw",
  },
});

export const ForumEventPostPageBanner = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {params} = useLocation();
  const {currentForumEvent} = useCurrentAndRecentForumEvents();

  const hideBanner =
    !currentForumEvent ||
    currentForumEvent.eventFormat !== "BASIC" ||
    !!currentForumEvent.customComponent;

  const {document: post} = useSingle({
    collectionName: "Posts",
    fragmentName: "PostsDetails",
    documentId: params._id,
    skip:
      !hasForumEvents ||
      !params._id ||
      hideBanner ||
      !currentForumEvent?.tagId,
  });

  if (hideBanner || !post) {
    return null;
  }

  const relevance = currentForumEvent.tagId ? (post?.tagRelevance?.[currentForumEvent.tagId] ?? 0) : 0;
  if (relevance < 1) {
    return null;
  }

  const {postPageDescription, bannerImageId, darkColor} = currentForumEvent;

  if (!postPageDescription?.html) return null;

  const {ContentStyles, ContentItemBody, CloudinaryImage2} = Components;
  return (
    <div className={classes.root}>
      <ContentStyles contentType="comment" className={classes.descriptionWrapper}>
        <ContentItemBody
          dangerouslySetInnerHTML={{__html: postPageDescription.html}}
          className={classes.description}
        />
      </ContentStyles>
      {bannerImageId &&
        <CloudinaryImage2
          publicId={bannerImageId}
          className={classes.image}
        />
      }
    </div>
  );
}

const ForumEventPostPageBannerComponent = registerComponent(
  "ForumEventPostPageBanner",
  ForumEventPostPageBanner,
  {styles},
);

declare global {
  interface ComponentTypes {
    ForumEventPostPageBanner: typeof ForumEventPostPageBannerComponent
  }
}
