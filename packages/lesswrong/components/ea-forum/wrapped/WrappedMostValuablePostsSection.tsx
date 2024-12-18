import React from "react";
import { Components, registerComponent } from "@/lib/vulcan-lib";
import { useForumWrappedContext } from "./hooks";
import DeferRender from "@/components/common/DeferRender";
import classNames from "classnames";

const styles = (theme: ThemeType) => ({
  mvpColLabels: {
    width: "100%",
    maxWidth: 500,
    display: "flex",
    justifyContent: "space-between",
  },
  mvpUpvotesLabel: {
    fontSize: 16,
    fontWeight: 600,
  },
  mvpHeartLabel: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: 13,
    fontWeight: 500,
    paddingRight: 20,
  },
  mvpHeartIcon: {
    fontSize: 16,
  },
  mvpList: {
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
  mvpPostItem: {
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
      color: theme.palette.wrapped.postScoreArrow,
    },
    "& .EAPostMeta-root": {
      color: theme.palette.wrapped.grey,
    },
    "& .PostsItem2MetaInfo-metaInfo": {
      color: theme.palette.wrapped.grey,
    },
  },
  mt10: {
    marginTop: 10,
  },
  mt30: {
    marginTop: 30,
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
      <div className={classNames(classes.mvpColLabels, classes.mt30)}>
        <div className={classes.mvpUpvotesLabel}>Your upvotes</div>
        <div className={classes.mvpHeartLabel}>
          Most valuable
          <ForumIcon icon="HeartOutline" className={classes.mvpHeartIcon} />
        </div>
      </div>
      <DeferRender ssr={false}>
        <div className={classNames(classes.mvpList, classes.mt10)}>
          <PostsByVoteWrapper
            voteType="bigUpvote"
            year={year}
            postItemClassName={classes.mvpPostItem}
            showMostValuableCheckbox
            hideEmptyStateText
          />
          <PostsByVoteWrapper
            voteType="smallUpvote"
            year={year}
            limit={10}
            postItemClassName={classes.mvpPostItem}
            showMostValuableCheckbox
            hideEmptyStateText
          />
        </div>
      </DeferRender>
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
