import React from "react";
import { Components, registerComponent } from "@/lib/vulcan-lib/components.tsx";
import { useForumWrappedContext } from "./hooks";

const styles = (theme: ThemeType) => ({
  textRow: {
    maxWidth: 500,
    textWrap: 'pretty',
    margin: '0 auto',
  },
  labels: {
    width: "100%",
    maxWidth: 500,
    display: "flex",
    justifyContent: "space-between",
    marginTop: 30,
    marginBottom: 10,
  },
  upvotesLabel: {
    fontSize: 16,
    fontWeight: 600,
  },
  heartLabel: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: 13,
    fontWeight: 500,
    paddingRight: 20,
  },
  heartIcon: {
    fontSize: 16,
  },
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    width: "100%",
    maxWidth: 500,
    textAlign: "left",
    marginBottom: 60,
  },
  loadMore: {
    color: theme.palette.text.alwaysWhite,
  }
});

const WrappedMostValuablePostsSection = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {
    year,
    mostValuablePosts,
    mostValuablePostsLoading,
    mostValuablePostsLoadMoreProps,
  } = useForumWrappedContext();
  const {
    WrappedSection, WrappedHeading, ForumIcon, WrappedPost, Loading, LoadMore,
  } = Components;
  return (
    <WrappedSection pageSectionContext="mostValuablePosts">
      <WrappedHeading>
        Take a moment to reflect on {year}
      </WrappedHeading>
      <div className={classes.textRow}>
        Look back at everything you upvoted &#8212; <strong>what did you find
        most valuable?</strong> Your answers will help us encourage more of the
        most valuable content.
      </div>
      <div className={classes.container}>
        <div className={classes.labels}>
          <div className={classes.upvotesLabel}>Your upvotes</div>
          <div className={classes.heartLabel}>
            Most valuable
            <ForumIcon icon="HeartOutline" className={classes.heartIcon} />
          </div>
        </div>
        <div className={classes.list}>
          {mostValuablePostsLoading && <Loading />}
          {mostValuablePosts.map((post) => (
            <WrappedPost key={post._id} post={post} showMostValuableCheckbox />
          ))}
          <LoadMore {...mostValuablePostsLoadMoreProps} className={classes.loadMore} />
        </div>
      </div>
    </WrappedSection>
  );
}

const WrappedMostValuablePostsSectionComponent = registerComponent(
  "WrappedMostValuablePostsSection",
  WrappedMostValuablePostsSection,
  {styles},
);

declare global {
  interface ComponentTypes {
    WrappedMostValuablePostsSection: typeof WrappedMostValuablePostsSectionComponent
  }
}
