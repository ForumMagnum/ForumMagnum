import React from "react";
import { Components, registerComponent } from "@/lib/vulcan-lib";
import { useForumWrappedContext } from "./hooks";

const styles = (theme: ThemeType) => ({
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
    width: "100%",
    maxWidth: 500,
    textAlign: "left",
    "& .LoadMore-root": {
      color: theme.palette.text.alwaysWhite,
    },
    "& .Loading-spinner": {
      margin: "10px 0 0",
    },
  },
  postItem: {
    marginBottom: 4,
    "& .EAPostsItem-expandedCommentsWrapper": {
      background: theme.palette.text.alwaysWhite,
      border: "none",
      "&:hover": {
        background: theme.palette.text.alwaysWhite,
        border: "none",
        opacity: 0.9,
      },
    },
    "& .PostsTitle-root": {
      color: theme.palette.wrapped.black,
    },
    "& .PostsTitle-read": {
      color: theme.palette.wrapped.black,
    },
    "& .PostsItemIcons-icon": {
      color: theme.palette.wrapped.grey,
    },
    "& .PostsItemIcons-linkIcon": {
      color: theme.palette.wrapped.grey,
    },
    "& .EAKarmaDisplay-root": {
      color: theme.palette.wrapped.grey,
    },
    "& .EAKarmaDisplay-voteArrow": {
      color: theme.palette.wrapped.postScore,
    },
    "& .EAPostMeta-root": {
      color: theme.palette.wrapped.grey,
    },
    "& .PostsItem2MetaInfo-metaInfo": {
      color: theme.palette.wrapped.grey,
    },
  },
});

const WrappedMostValuablePostsSection = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {year} = useForumWrappedContext();
  const {WrappedSection, WrappedHeading, ForumIcon, PostsByVoteWrapper} = Components;
  return (
    <WrappedSection pageSectionContext="mostValuablePosts">
      <WrappedHeading>
        Take a moment to reflect on {year}
      </WrappedHeading>
      <div>
        Look back at everything you upvoted - what did you find most valuable?
        Your answers will help us encourage more of the most valuable content.
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
          <PostsByVoteWrapper
            voteType="bigUpvote"
            year={year}
            postItemClassName={classes.postItem}
            showMostValuableCheckbox
            hideEmptyStateText
          />
          <PostsByVoteWrapper
            voteType="smallUpvote"
            year={year}
            limit={10}
            postItemClassName={classes.postItem}
            showMostValuableCheckbox
            hideEmptyStateText
          />
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
