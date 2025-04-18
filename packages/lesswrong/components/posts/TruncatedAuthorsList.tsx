import React, { useRef, useEffect, RefObject } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { usePostsUserAndCoauthors } from "./usePostsUserAndCoauthors";
import { recalculateTruncation } from "../../lib/truncateUtils";
import classNames from "classnames";
import { useState } from "react";

const styles = (_: ThemeType) => ({
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

const TruncatedAuthorsList = ({
  post,
  expandContainer,
  className,
  classes,
  useMoreSuffix = true
}: {
  post: PostsList | SunshinePostsList | PostsBestOfList,
  expandContainer: RefObject<HTMLDivElement>,
  className?: string,
  classes: ClassesType<typeof styles>,
  useMoreSuffix?: boolean,
}) => {
  const {isAnon, authors, topCommentAuthor} = usePostsUserAndCoauthors(post);
  const ref = useRef<HTMLDivElement>(null);
  const [hiddenAuthors, setHiddenAuthors] = useState<UsersMinimumInfo[]>([]);

  useEffect(() => {
    if (isAnon || authors.length === 0) {
      setHiddenAuthors([]);
      return;
    }
    const reformatAuthorPlaceholder = (
      moreCount: number,
      totalItems: number,
      moreNode: Element,
    ) => {
      const hidden = authors.slice(totalItems - moreCount);
      setHiddenAuthors(hidden);

      let text: string;
      if (moreCount === totalItems) {
        text = `${moreCount} authors`;
      } else {
        if (useMoreSuffix) {
          text = `+ ${moreCount} more`;
        } else {
          text = `+${moreCount}`;
        }
      }
      moreNode.innerHTML = moreNode.innerHTML.replace(
        /(\+ \d+(?: more)?)|(\d+ authors)/,
        text,
      );
    }

    const handler = () => recalculateTruncation(
      ref,
      expandContainer,
      classes,
      reformatAuthorPlaceholder,
    );
    handler();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [isAnon, authors, topCommentAuthor, ref, classes, expandContainer, useMoreSuffix]);

  const {UsersNameDisplay, UserNameDeleted, LWTooltip} = Components;

  return isAnon || authors.length === 0
    ? <UserNameDeleted />
    : (
      <div className={classNames(classes.root, className)} ref={ref}>
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
          {hiddenAuthors.length > 0 && (
            <LWTooltip
              title={
                <div className={classes.tooltip}>
                  {hiddenAuthors.map((author) => (
                    <UsersNameDisplay key={author._id} user={author} />
                  ))}
                </div>
              }
              className={classes.more}
            >
              + 0 more
            </LWTooltip>
          )}
        </div>
      </div>
    );
}

const TruncatedAuthorsListComponent = registerComponent(
  "TruncatedAuthorsList",
  TruncatedAuthorsList,
  {styles, stylePriority: -2},
);

declare global {
  interface ComponentTypes {
    TruncatedAuthorsList: typeof TruncatedAuthorsListComponent
  }
}
