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
  },
  postsScrollContainer: {
    overflowY: "scroll",
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

  const topRef = useRef<HTMLDivElement>(null);
  const [yPosition, setYPosition] = useState<number>(200);
  
  const sorting = query["postsSortedBy"] || "new";

  const terms = {
    ...tagPostTerms(tag, {sortedBy: sorting}),
    limit: 30,
  };

  const recalculateYPosition = useCallback(() => {
    if (!topRef.current) return;
    // FIXME remove this js logic and use same strategy as https://github.com/ForumMagnum/ForumMagnum/pull/5939 once it is merged
    const bottomMargin = 45;
    const newYPosition = topRef.current.getBoundingClientRect().top + bottomMargin;
    if (newYPosition !== yPosition) setYPosition(newYPosition);
  }, [yPosition]);

  useEffect(() => {
    recalculateYPosition();
    window.addEventListener("resize", recalculateYPosition);
    return () => window.removeEventListener("resize", recalculateYPosition);
  }, [recalculateYPosition]);

  return (
    <>
      <div ref={topRef} />
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
        <div className={classes.postsScrollContainer} style={{ height: `calc(100vh - ${yPosition}px)` }}>
          <PostsList2 terms={terms} enableTotal tagId={tag._id} itemsPerPage={30} hideTrailingButtons tooltipPlacement={"top-end"} />
        </div>
      </div>
    </>
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
