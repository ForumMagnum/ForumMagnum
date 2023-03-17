import React, { useRef, useEffect, RefObject } from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { usePostsUserAndCoauthors } from "./usePostsUserAndCoauthors";

const styles = (_: ThemeType): JssStyles => ({
  root: {
    position: "relative",
    overflow: "hidden",
    whiteSpace: "nowrap",
    maxWidth: "100%",
    fontSize: 13,
  },
  item: {},
  overflowContainer: {
    display: "inline",
  },
  overflowCount: {
    marginLeft: 4,
    "@media screen and (max-width: 500px)": {
      display: "none",
    },
  },
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

// Here be dragons
const recalculate = (
  ref: RefObject<HTMLDivElement>,
  expandContainer: RefObject<HTMLDivElement>,
  classes: ClassesType,
  isAnon: boolean,
) => {
  if (!ref.current || !expandContainer.current || isAnon) {
    return;
  }

  const scratch = ref.current.querySelector("." + classes.scratch);
  if (!scratch) {
    return;
  }

  const more = scratch.querySelector("." + classes.more);
  if (!more) {
    return;
  }

  const maxWidth = getMaxExpandableWidth(expandContainer.current);
  const authors = Array.from(scratch.querySelectorAll("." + classes.item));
  const bounds = authors.map((author) => author.getBoundingClientRect());

  let width = bounds[0].width;
  let moreCount = 0;
  let i: number;
  for (i = 1; i < bounds.length; ++i) {
    const newWidth = width + bounds[i].width;
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

  ref.current.innerHTML = "";
  for (let j = 0; j < i; ++j) {
    ref.current.appendChild(authors[j].cloneNode(true));
  }
  if (moreCount) {
    const moreNode = more.cloneNode(true) as HTMLSpanElement;
    moreNode.innerHTML = moreNode.innerHTML.replace(
      /\+ .* more/,
      `+ ${moreCount} more`,
    );
    ref.current.appendChild(moreNode);
  }
  ref.current.appendChild(scratch);
}

const TruncatedAuthorsList = ({post, expandContainer, classes}: {
  post: PostsList | SunshinePostsList,
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
  }, [isAnon, authors, topCommentAuthor, ref, classes.item]);

  const {UsersName, UserNameDeleted} = Components;

  return isAnon || authors.length == 0
    ? <UserNameDeleted />
    : (
      <div className={classes.root} ref={ref}>
        <span key={authors[0]._id} className={classes.item}>
          <UsersName user={authors[0]} />
        </span>
        <div className={classes.scratch} aria-hidden="true">
          {authors.map((author, i) =>
            <span key={author._id} className={classes.item}>
              {i > 0 ? ", " : ""}
              <UsersName user={author} />
            </span>
          )}
          <span className={classes.more}>+ 0 more</span>
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
