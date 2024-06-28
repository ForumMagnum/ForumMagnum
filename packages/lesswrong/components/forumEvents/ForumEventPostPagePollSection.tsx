import React, { CSSProperties } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useCurrentForumEvent } from "../hooks/useCurrentForumEvent";
import { useLocation } from "../../lib/routeUtil";
import { useSingle } from "../../lib/crud/withSingle";
import { hasForumEvents } from "../../lib/betas";
import { AnalyticsContext } from "@/lib/analyticsEvents";
import { makeCloudinaryImageUrl } from "../common/CloudinaryImage2";

const styles = (theme: ThemeType) => ({
  root: {
    position: "relative",
    width: "100%",
    fontFamily: theme.palette.fonts.sansSerifStack,
    padding: 24,
    borderRadius: theme.borderRadius.default,
    marginBottom: 40,
    // '@media (max-width: 700px)': {
    //   display: 'none'
    // }
  },
  heading: {
    fontSize: 24,
    fontWeight: 700,
    lineHeight: 'normal',
    marginTop: 0,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    fontWeight: 500,
    lineHeight: 'normal',
    marginBottom: 20,
  },
  pollArea: {
    paddingTop: 20,
    borderRadius: theme.borderRadius.default,
    '& .ForumEventPoll-question': {
      fontSize: 24,
    },
    '& .ForumEventPoll-questionFootnote': {
      fontSize: 16,
    }
  },
});

export const ForumEventPostPagePollSection = ({postId, classes}: {
  postId: string,
  classes: ClassesType<typeof styles>,
}) => {
  const {params} = useLocation();
  const {currentForumEvent} = useCurrentForumEvent();

  const {document: post} = useSingle({
    collectionName: "Posts",
    fragmentName: "PostsDetails",
    documentId: params._id,
    skip: !hasForumEvents || !params._id || !currentForumEvent?.tagId || !currentForumEvent?.includesPoll,
  });

  // Only show this section for forum events that have a poll
  if (!currentForumEvent || !post || !currentForumEvent.includesPoll) {
    return null;
  }

  const relevance = post?.tagRelevance?.[currentForumEvent.tagId] ?? 0;
  if (relevance < 1) {
    return null;
  }

  const {bannerImageId, darkColor, lightColor} = currentForumEvent;
  const pollAreaStyle: CSSProperties = {background: darkColor}
  if (bannerImageId) {
    const background = `top / cover no-repeat url(${makeCloudinaryImageUrl(bannerImageId, {
      c: "fill",
      dpr: "auto",
      q: "auto",
      f: "auto",
      g: "north",
    })}), ${darkColor}`
    pollAreaStyle.background = background
  }

  const {ForumEventPoll} = Components;

  return (
    <AnalyticsContext pageSectionContext="forumEventPostPagePollSection">
      <div className={classes.root} style={{background: lightColor, color: darkColor}}>
        <h2 className={classes.heading}>Did this post change your mind?</h2>
        <div className={classes.description}>
          July 1-7 is AI welfare debate week on the Forum. Some more text that’s helpful here
        </div>
        <div className={classes.pollArea} style={pollAreaStyle}>
          <ForumEventPoll postId={postId} hideViewResults />
        </div>
      </div>
    </AnalyticsContext>
  );
}

const ForumEventPostPagePollSectionComponent = registerComponent(
  "ForumEventPostPagePollSection",
  ForumEventPostPagePollSection,
  {styles},
);

declare global {
  interface ComponentTypes {
    ForumEventPostPagePollSection: typeof ForumEventPostPagePollSectionComponent
  }
}
