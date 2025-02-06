import React, { useRef, useEffect, RefObject } from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { recalculateTruncation } from "../../lib/truncateUtils";
import classNames from "classnames";
import { useMulti } from "@/lib/crud/withMulti";

const styles = (theme: ThemeType) => ({
  root: {
    position: "relative",
    overflow: "hidden",
    whiteSpace: "nowrap",
    maxWidth: "100%",
    fontSize: 13,
    fontWeight: 450,
  },
  item: {},
  placeholder: {},
  tooltip: {
    display: "flex",
    flexDirection: "column",
  },
  more: {
    paddingLeft: 4,
    color: theme.palette.grey[600],
  },
  scratch: {
    position: "absolute",
    opacity: 0,
    pointerEvents: "none",
  },
});

const reformatTagPlaceholder = (
  moreCount: number,
  _totalItems: number,
  moreNode: Element,
) => {
  moreNode.innerHTML = moreNode.innerHTML.replace(
    /\d+ more/,
    `${moreCount} more`,
  );
}

const TruncatedTagsList = ({post, expandContainer, className, classes}: {
  post: PostsList | SunshinePostsList | PostsBestOfList,
  expandContainer: RefObject<HTMLDivElement>,
  className?: string,
  classes: ClassesType<typeof styles>,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  // The post passed in as an argument might have a post fragment that contains
  // tags with preview text included, or it might not. In the latter case,
  // start a request to fetch the tags, so that we can display them if they're
  // hovered.
  const { results, loading } = useMulti({
    terms: {
      view: "tagsOnPost",
      postId: post._id,
    },
    collectionName: "TagRels",
    fragmentName: "TagRelMinimumFragment",
    limit: 100,
    skip: !post.tags.length || ('description' in post.tags[0]),
    ssr: false,
  });
  
  const tags = results
    ? results.map(tagRel => tagRel.tag)
    : post.tags;

  useEffect(() => {
    if (!tags?.length) {
      return;
    }
    const handler = () => recalculateTruncation(
      ref,
      expandContainer,
      classes,
      reformatTagPlaceholder,
    );
    handler();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [tags, ref, classes.item, expandContainer, classes]);

  if (!tags?.length) {
    return null;
  }

  const {FooterTag} = Components;
  return (
    <div className={classNames(classes.root, className)} ref={ref}>
      <span className={classNames(classes.item, classes.placeholder)} />
      <div className={classes.scratch} aria-hidden="true">
        {tags.map((tag) => tag &&
          <span key={tag._id} className={classes.item}>
            <FooterTag tag={tag} smallText hoverable="ifDescriptionPresent" />
          </span>
        )}
        <span className={classes.more}>
          0 more
        </span>
      </div>
    </div>
  );
}

const TruncatedTagsListComponent = registerComponent(
  "TruncatedTagsList",
  TruncatedTagsList,
  {styles, stylePriority: -1},
);

declare global {
  interface ComponentTypes {
    TruncatedTagsList: typeof TruncatedTagsListComponent
  }
}
