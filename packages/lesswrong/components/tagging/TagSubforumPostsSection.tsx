import React, { useCallback, useEffect, useRef, useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import AddBoxIcon from "@material-ui/icons/AddBox";
import { tagPostTerms } from "./TagPage";
import { useLocation } from "../../lib/routeUtil";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "flex",
    flexDirection: "column",
    padding: "0 10px",
    flexBasis: 0,
    flexGrow: 1,
  },
  postsScrollContainer: {
    overflowY: "auto",
    flexBasis: 0,
    flexGrow: 1,
  },
  newPostButton: {
    alignSelf: "flex-end",
    marginBottom: 8,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    '& .PostsListSortDropdown-root': {
      marginTop: 0,
      marginBottom: 6,
    }
  }
});

export const TagSubforumPostsSection = ({ classes, tag }: { classes: ClassesType; tag: TagSubforumFragment }) => {
  const { SectionButton, PostsList2, PostsListSortDropdown } = Components;
  const { query } = useLocation();
  
  const sorting = query["postsSortedBy"] || "new";

  const terms = {
    ...tagPostTerms(tag, {sortedBy: sorting}),
    limit: 30,
  };

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <PostsListSortDropdown value={sorting} sortingParam={"postsSortedBy"} />
        <a className={classes.newPostButton} href={`/newPost?subforumTagId=${tag._id}`}>
          <SectionButton>
            <AddBoxIcon />
            New Subforum Post
          </SectionButton>
        </a>
      </div>
      <div className={classes.postsScrollContainer}>
        <PostsList2 terms={terms} enableTotal tagId={tag._id} itemsPerPage={30} hideTrailingButtons tooltipPlacement={"top-end"} />
      </div>
    </div>
  );
};

const TagSubforumPostsSectionComponent = registerComponent("TagSubforumPostsSection", TagSubforumPostsSection, {
  styles,
});

declare global {
  interface ComponentTypes {
    TagSubforumPostsSection: typeof TagSubforumPostsSectionComponent;
  }
}
