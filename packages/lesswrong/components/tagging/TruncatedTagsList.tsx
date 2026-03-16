import React, { useRef, useEffect, RefObject } from "react";
import { recalculateTruncation } from "../../lib/truncateUtils";
import classNames from "classnames";
import FooterTag from "./FooterTag";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles("TruncatedTagsList", (theme: ThemeType) => ({
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
}), { stylePriority: -1 });

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

const TruncatedTagsList = ({post, expandContainer, className}: {
  post: PostsList | SunshinePostsList | PostsBestOfList,
  expandContainer: RefObject<HTMLDivElement|null>,
  className?: string,
}) => {
  const classes = useStyles(styles);
  const ref = useRef<HTMLDivElement>(null);
  const tags = post.tags;

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
  return (
    <div className={classNames(classes.root, className)} ref={ref}>
      <span className={classNames(classes.item, classes.placeholder)} />
      <div className={classes.scratch} aria-hidden="true">
        {tags.map((tag) => tag &&
          <span key={tag._id} className={classes.item}>
            <FooterTag tag={tag} smallText hoverable={false} />
          </span>
        )}
        <span className={classes.more}>
          0 more
        </span>
      </div>
    </div>
  );
}

export default TruncatedTagsList;
