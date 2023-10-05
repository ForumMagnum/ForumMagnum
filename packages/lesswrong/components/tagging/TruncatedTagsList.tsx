import React, { useRef, useEffect, RefObject } from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { sortTags } from "./FooterTagList";
import { TRUNCATION_PADDING, getMaxExpandableWidth } from "../posts/TruncatedAuthorsList";
import classNames from "classnames";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    position: "relative",
    overflow: "hidden",
    whiteSpace: "nowrap",
    maxWidth: "100%",
    fontSize: 13,
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

/**
 * Here be dragons
 *
 * This function is called in a useEffect hook to format the tags names how
 * we want. This needs to be done _after_ the react render because we need to
 * know the size of each name in pixels which requires the DOM nodes to already
 * be mounted.
 *
 * The general idea is that react renders all the names into a separate "scratch"
 * div which has opacity: 0. This function then looks at how much space we
 * have to play with and the size of each name, and moves as many names as
 * possible from the "scratch" div into the actual visible div.
 *
 * When there's not enough space for all the names we add some text saying 'n
 * more' where n is the number of excluded tags.
 */
const recalculate = (
  ref: RefObject<HTMLDivElement>,
  expandContainer: RefObject<HTMLDivElement>,
  classes: ClassesType,
) => {
  if (!ref.current || !expandContainer.current) {
    return;
  }

  // Get the 'off-screen' scratch buffer (it's actually on-screen with opacity 0)
  const scratch = ref.current.querySelector("." + classes.scratch);
  if (!scratch) {
    return;
  }

  // Find the 'n more' node and make sure it's at the end of the scratch node
  let more = scratch.querySelector("." + classes.more);
  if (!more) {
    more = ref.current.querySelector("." + classes.more);
    if (!more) {
      return;
    }
    scratch.appendChild(more);
  }

  // Remove the placeholder if it exists
  const placeholder = ref.current.querySelector("." + classes.placeholder);
  if (placeholder) {
    ref.current.removeChild(placeholder);
  }

  // Move all the tags into the scratch node
  const displayedTags = ref.current.querySelectorAll("." + classes.item);
  for (const tag of Array.from(displayedTags).reverse()) {
    scratch.insertBefore(tag, scratch.firstChild);
  }

  // Find how much space we have and what needs to fit there
  const maxWidth = getMaxExpandableWidth(expandContainer.current);
  const tags = Array.from(scratch.querySelectorAll("." + classes.item));
  const bounds = tags.map((tag) => tag.getBoundingClientRect());

  // Calculate how may tags we can fit
  let width = bounds[0].width;
  let moreCount = 0;
  let i = 1;
  for ( ; i < bounds.length; ++i) {
    const newWidth = width + bounds[i].width + TRUNCATION_PADDING;
    if (newWidth > maxWidth) {
      const moreWidth = more?.getBoundingClientRect().width;
      if (width + moreWidth > maxWidth) {
        i--;
      }
      moreCount = bounds.length - i;
      break;
    }
    width = newWidth;
  }

  // Move all the visible tags to the right place and set n in 'n more' if shown
  ref.current.innerHTML = "";
  for (let j = 0; j < i; ++j) {
    ref.current.appendChild(tags[j]);
  }
  if (moreCount) {
    const text = `${moreCount} more`
    more.innerHTML = more.innerHTML.replace(/\+ \d+ more/, text);
    ref.current.appendChild(more);
  }
  ref.current.appendChild(scratch);
}

const TruncatedTagsList = ({post, expandContainer, className, classes}: {
  post: PostsList | SunshinePostsList | PostsBestOfList,
  expandContainer: RefObject<HTMLDivElement>,
  className?: string,
  classes: ClassesType,
}) => {
  const tags = post.tags
    ? sortTags(post.tags, (t) => t).slice(0, 4)
    : null;

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => recalculate(ref, expandContainer, classes);
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
        {tags.map((tag) =>
          <span key={tag._id} className={classes.item}>
            <FooterTag tag={tag} smallText />
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
