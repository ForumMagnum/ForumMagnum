import React, { useRef, useEffect, RefObject } from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { usePostsUserAndCoauthors } from "./usePostsUserAndCoauthors";
import classNames from "classnames";

const TRUNCATION_PADDING = 10;

const styles = (_: ThemeType): JssStyles => ({
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
  },
  scratch: {
    position: "absolute",
    opacity: 0,
    pointerEvents: "none",
  },
});

const getMaxExpandableWidth = (container: HTMLElement): number => {
  let width = container.getBoundingClientRect().width;
  // Get expandable width excluding first child
  for (let i = 1; i < container.children.length; ++i) {
    const child = container.children[i];
    width -= child.getBoundingClientRect().width;
  }
  return width;
}

/**
 * Here be dragons
 *
 * This function is called in a useEffect hook to format the authors' names how
 * we want. This needs to be done _after_ the react render because we need to
 * know the size of each name in pixels which requires the DOM nodes to already
 * be mounted.
 *
 * The general idea is that react renders all the names into a separate "scratch"
 * div which has opacity: 0. This function then looks at how much space we
 * have to play with and the size of each name, and moves as many names as
 * possible from the "scratch" div into the actual visible div.
 *
 * When there's not enough space for all the names we add some text saying '+ n
 * more' where n is the number of excluded names. When no names can be shown we
 * display some text saying 'n authors'.
 */
const recalculate = (
  ref: RefObject<HTMLDivElement>,
  expandContainer: RefObject<HTMLDivElement>,
  classes: ClassesType,
  isAnon: boolean,
) => {
  if (!ref.current || !expandContainer.current || isAnon) {
    return;
  }

  // Get the 'off-screen' scratch buffer (it's actually on-screen with opacity 0)
  const scratch = ref.current.querySelector("." + classes.scratch);
  if (!scratch) {
    return;
  }

  // Find the '+ n more' node and make sure it's at the end of the scratch node
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

  // Move all the authors into the scratch node
  const displayedAuthors = ref.current.querySelectorAll("." + classes.item);
  for (const author of Array.from(displayedAuthors).reverse()) {
    scratch.insertBefore(author, scratch.firstChild);
  }

  // Find how much space we have and what needs to fit there
  const maxWidth = getMaxExpandableWidth(expandContainer.current);
  const authors = Array.from(scratch.querySelectorAll("." + classes.item));
  const bounds = authors.map((author) => author.getBoundingClientRect());

  // Calculate how may authors we can fit
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

  // Move all the visible authors to the right place and set n in '+ n more' if shown
  ref.current.innerHTML = "";
  for (let j = 0; j < i; ++j) {
    ref.current.appendChild(authors[j]);
  }
  if (moreCount) {
    const text = moreCount === authors.length
      ? `${moreCount} authors`
      : `+ ${moreCount} more`
    more.innerHTML = more.innerHTML.replace(/(\+ \d+ more)|(\d+ authors)/, text);
    ref.current.appendChild(more);
  }
  ref.current.appendChild(scratch);
}

const TruncatedAuthorsList = ({post, expandContainer, classes}: {
  post: PostsList | SunshinePostsList | PostsBestOfList,
  expandContainer: RefObject<HTMLDivElement>,
  classes: ClassesType,
}) => {
  const {isAnon, authors, topCommentAuthor} = usePostsUserAndCoauthors(post);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => recalculate(ref, expandContainer, classes, isAnon);
    handler();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [isAnon, authors, topCommentAuthor, ref, classes.item, expandContainer, classes]);

  const {UsersNameDisplay, UserNameDeleted, LWTooltip} = Components;

  return isAnon || authors.length == 0
    ? <UserNameDeleted />
    : (
      <div className={classes.root} ref={ref}>
        <span className={classNames(classes.item, classes.placeholder)}>
          <UsersNameDisplay user={authors[0]} />
        </span>
        <div className={classes.scratch} aria-hidden="true">
          {authors.map((author, i) =>
            <span key={author._id} className={classes.item}>
              {i > 0 ? ", " : ""}
              <UsersNameDisplay user={author} />
            </span>
          )}
          <LWTooltip
            title={
              <div className={classes.tooltip}>
                  {authors.map((author) =>
                    <UsersNameDisplay key={author._id} user={author} />
                  )}
              </div>
            }
            className={classes.more}
          >
            + 0 more
          </LWTooltip>
        </div>
      </div>
    );
}

const TruncatedAuthorsListComponent = registerComponent(
  "TruncatedAuthorsList",
  TruncatedAuthorsList,
  {styles},
);

declare global {
  interface ComponentTypes {
    TruncatedAuthorsList: typeof TruncatedAuthorsListComponent
  }
}
