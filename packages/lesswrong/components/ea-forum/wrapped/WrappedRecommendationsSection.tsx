import React from "react";
import { registerComponent } from "@/lib/vulcan-lib/components";
import { useForumWrappedContext } from "./hooks";
import { drawnArrow } from "@/components/icons/drawnArrow";
import { WrappedSection } from "./WrappedSection";
import { WrappedHeading } from "./WrappedHeading";
import { WrappedPost } from "./WrappedPost";

const styles = (theme: ThemeType) => ({
  posts: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    width: "100%",
    maxWidth: 380,
    margin: "60px auto 0",
    "& .RecommendationsList-noMoreMessage": {
      color: theme.palette.text.alwaysWhite,
    },
  },
  arrowContainer: {
    position: "absolute",
    top: -44,
    right: 0,
    width: "100%",
    height: 3,
  },
  saveForLater: {
    position: "absolute",
    top: 0,
    right: 0,
    transform: "translateX(14px)",
  },
  saveForLaterText: {
    transform: "translateX(-40px)",
  },
  arrow: {
    transform: "rotate(-50deg)",
  },
});

/**
 * Section that displays some recommended posts to the user
 */
const WrappedRecommendationsSectionInner = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {recommendations} = useForumWrappedContext();
  return (
    <WrappedSection pageSectionContext="recommendations">
      <WrappedHeading>
        Posts you missed that we think you’ll enjoy
      </WrappedHeading>
      {recommendations.length > 0 &&
        <div className={classes.posts}>
          <div className={classes.arrowContainer}>
            <aside className={classes.saveForLater}>
              <div className={classes.saveForLaterText}>Save for later</div>
              <div className={classes.arrow}>{drawnArrow}</div>
            </aside>
          </div>
          {recommendations.map((post) => (
            <WrappedPost post={post} key={post._id} />
          ))}
        </div>
      }
    </WrappedSection>
  );
}

export const WrappedRecommendationsSection = registerComponent(
  "WrappedRecommendationsSection",
  WrappedRecommendationsSectionInner,
  {styles},
);

declare global {
  interface ComponentTypes {
    WrappedRecommendationsSection: typeof WrappedRecommendationsSection
  }
}
