import React from "react";
import { Components, registerComponent } from "@/lib/vulcan-lib/components.tsx";
import { useForumWrappedContext } from "./hooks";
import { drawnArrow } from "@/components/icons/drawnArrow";

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
