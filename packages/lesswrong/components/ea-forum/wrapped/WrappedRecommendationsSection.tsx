import React, { FC } from "react";
import { Components, registerComponent } from "@/lib/vulcan-lib";
import DeferRender from "@/components/common/DeferRender";

const styles = (theme: ThemeType) => ({
  recommendedPosts: {
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

const ListItem: FC<{
  post: PostsListWithVotesAndSequence,
  translucentBackground?: boolean,
}> = ({post}) => <Components.WrappedPost post={post} />;

/**
 * Section that displays some recommended posts to the user
 */
const WrappedRecommendationsSection = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {WrappedSection, WrappedHeading, RecommendationsList} = Components;
  return (
    <WrappedSection pageSectionContext="recommendations">
      <WrappedHeading>
        Posts you missed that we think you’ll enjoy
      </WrappedHeading>
      <DeferRender ssr={false}>
        <RecommendationsList
          algorithm={{
            strategy: {name: "bestOf", postId: ""},
            count: 5,
            disableFallbacks: true,
          }}
          ListItem={ListItem}
          className={classes.recommendedPosts}
        />
      </DeferRender>
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
