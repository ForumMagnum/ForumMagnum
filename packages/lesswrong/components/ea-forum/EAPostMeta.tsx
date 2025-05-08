import React, { useRef } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { InteractionWrapper } from "../common/useClickableCell";
import { DateWithoutTime } from "../posts/PostsItemMeta";
import classNames from "classnames";
import { TruncatedAuthorsList } from "../posts/TruncatedAuthorsList";
import { PostsItemDate } from "../posts/PostsItemDate";
import { ForumIcon } from "../common/ForumIcon";
import { LWTooltip } from "../common/LWTooltip";
import { EventTime } from "../localGroups/EventTime";

const styles = (theme: ThemeType) => ({
  root: {
    color: theme.palette.grey[600],
    flexGrow: 1,
    display: "flex",
    alignItems: "center",
    overflow: "hidden",
    "& > :first-child": {
      marginRight: 5,
    },
  },
  date: {
    "@media screen and (max-width: 280px)": {
      display: "none",
    },
  },
  readTime: {
    "@media screen and (max-width: 350px)": {
      display: "none",
    },
  },
  interactionWrapper: {
    "&:hover": {
      opacity: 1,
    },
  },
  icon: {
    width: 16,
  },
  eventOrganizer: {
    display: "flex",
    fontSize: "14px",
  },
  dot: {
    margin: "0 4px",
  },
  authorsList: {
    fontSize: 14,
  }
});

const EAPostMetaInner = ({post, useEventStyles, useCuratedDate=true, className, classes}: {
  post: PostsList | SunshinePostsList,
  useEventStyles?: boolean,
  useCuratedDate?: boolean,
  className?: string,
  classes: ClassesType<typeof styles>,
}) => {
  const authorExpandContainer = useRef(null);
  if (useEventStyles && post.isEvent) {
    return (
      <div className={classNames(classes.root, className)} ref={authorExpandContainer}>
        <ForumIcon icon="Calendar" className={classes.icon} />
        {post.startTime ? (
          <LWTooltip title={<EventTime post={post} />}>
            <DateWithoutTime date={post.startTime} />
          </LWTooltip>
        ) : (
          <LWTooltip title={<span>To be determined</span>}>
            <span>TBD</span>
          </LWTooltip>
        )}
        <span className={classes.eventOrganizer}>
          <span className={classes.dot}>·</span>
          <InteractionWrapper className={classes.interactionWrapper}>
            <TruncatedAuthorsList post={post} expandContainer={authorExpandContainer} className={classes.authorsList} />
          </InteractionWrapper>
        </span>
      </div>
    );
  }

  return (
    <div
      className={classNames(classes.root, className)}
      ref={authorExpandContainer}
    >
      <InteractionWrapper className={classes.interactionWrapper}>
        <TruncatedAuthorsList
          post={post}
          expandContainer={authorExpandContainer}
        />
      </InteractionWrapper>
      <div>
        <span className={classes.date}>
          {" · "}
          <PostsItemDate post={post} noStyles includeAgo useCuratedDate={useCuratedDate} />
        </span>
        {(!post.fmCrosspost?.isCrosspost || post.fmCrosspost.hostedHere) &&
          <span className={classes.readTime}>
          {" · "}{post.readTimeMinutes || 1}m read
        </span>}
      </div>
    </div>
  );
}

export const EAPostMeta = registerComponent(
  "EAPostMeta",
  EAPostMetaInner,
  {styles, stylePriority: -1},
);

declare global {
  interface ComponentTypes {
    EAPostMeta: typeof EAPostMeta,
  }
}
