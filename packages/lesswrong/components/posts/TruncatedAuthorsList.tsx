import React, { useRef, useEffect, useState, ReactNode, RefObject } from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { usePostsUserAndCoauthors } from "./usePostsUserAndCoauthors";

const styles = (_: ThemeType): JssStyles => ({
  root: {
    position: "relative",
    overflowX: "hidden",
    whiteSpace: "nowrap",
    maxWidth: "100%",
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
});

const recalculate = (
  ref: RefObject<HTMLDivElement>,
  afterRef: RefObject<HTMLDivElement>,
  selector: string,
  isAnon: boolean,
  setOverflowCount: (count: number) => void,
) => {
  if (!ref.current || !afterRef.current || isAnon) {
    setOverflowCount(0);
    return;
  }
  const afterWidth = afterRef.current.getBoundingClientRect().width ?? 0;
  const containerRight = ref.current.getBoundingClientRect().right;
  const elems: NodeListOf<HTMLSpanElement> = ref.current.querySelectorAll(selector);
  elems[elems.length - 1].after(afterRef.current);
  for (let i = 0; i < elems.length; ++i) {
    elems[i].style.opacity = "100%";
  }
  for (let i = 1; i < elems.length; ++i) {
    const elemBounds = elems[i].getBoundingClientRect();
    if (elemBounds.right + afterWidth > containerRight) {
      setOverflowCount(elems.length - i);
      elems[i].before(afterRef.current);
      for ( ; i < elems.length; ++i) {
        elems[i].style.opacity = "0%";
      }
      return;
    }
  }
  setOverflowCount(0);
}

const TruncatedAuthorsList = ({post, after, classes}: {
  post: PostsList | SunshinePostsList,
  after?: ReactNode,
  classes: ClassesType,
}) => {
  const {isAnon, authors, topCommentAuthor} = usePostsUserAndCoauthors(post);
  const ref = useRef<HTMLDivElement>(null);
  const afterRef = useRef<HTMLDivElement>(null);
  const [overflowCount, setOverflowCount] = useState(0);

  useEffect(() => {
    const handler = () => recalculate(
      ref,
      afterRef,
      `.${classes.item}`,
      isAnon,
      setOverflowCount,
    );
    handler();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [isAnon, authors, topCommentAuthor, ref]);

  const {UsersName, UserNameDeleted, LWTooltip} = Components;

  return isAnon
    ? <UserNameDeleted />
    : (
      <div className={classes.root} ref={ref}>
        {authors.map((author, i) =>
          <span key={author._id} className={classes.item}>
            {i > 0 ? ", " : ""}
            <UsersName user={author} />
          </span>
        )}
        <div className={classes.overflowContainer} ref={afterRef}>
          {overflowCount > 0 &&
            <LWTooltip
              title={
                <div className={classes.tooltip}>
                  {authors.slice(authors.length - overflowCount).map((author) =>
                    <UsersName key={author._id} user={author} />
                  )}
                </div>
              }
              className={classes.overflowCount}
            >
              + {overflowCount} more
            </LWTooltip>
          }
          {after}
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
