import React from "react";
import { Components, registerComponent } from "@/lib/vulcan-lib";
import { useForumWrappedContext } from "./hooks";
import { drawnArrow } from "@/components/icons/drawnArrow";

const styles = (theme: ThemeType) => ({
  arrowContainer: {
    width: "100%",
    height: 3,
    position: "relative",
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
  posts: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    width: "100%",
    maxWidth: 380,
    margin: "40px auto 0",
    "& .RecommendationsList-noMoreMessage": {
      color: theme.palette.text.alwaysWhite,
    },
  },
});

/**
 * Section that displays some recommended posts to the user
 */
const WrappedRecommendationsSection = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {recommendations} = useForumWrappedContext();
  const {WrappedSection, WrappedHeading, WrappedPost} = Components;
  return (
    <WrappedSection pageSectionContext="recommendations">
      <WrappedHeading>
        Posts you missed that we think you’ll enjoy
      </WrappedHeading>
      <div className={classes.arrowContainer}>
        <aside className={classes.saveForLater}>
          <div className={classes.saveForLaterText}>Save for later</div>
          <div className={classes.arrow}>{drawnArrow}</div>
        </aside>
      </div>
      {recommendations.length > 0 &&
        <div className={classes.posts}>
          {recommendations.map((post) => (
            <WrappedPost post={post} key={post._id} />
          ))}
        </div>
      }
    </WrappedSection>
  );
}

const WrappedRecommendationsSectionComponent = registerComponent(
  "WrappedRecommendationsSection",
  WrappedRecommendationsSection,
  {styles},
);

declare global {
  interface ComponentTypes {
    WrappedRecommendationsSection: typeof WrappedRecommendationsSectionComponent
  }
}
