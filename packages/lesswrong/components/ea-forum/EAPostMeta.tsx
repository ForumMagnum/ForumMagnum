import React, { useRef } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { InteractionWrapper } from "../common/useClickableCell";

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
});

const EAPostMeta = ({post, classes}: {
  post: PostsList,
  classes: ClassesType,
}) => {
  const authorExpandContainer = useRef(null);
  const {TruncatedAuthorsList, PostsItemDate} = Components;
  return (
    <div className={classes.root} ref={authorExpandContainer}>
      <InteractionWrapper className={classes.interactionWrapper}>
        <TruncatedAuthorsList
          post={post}
          expandContainer={authorExpandContainer}
        />
      </InteractionWrapper>
      <div>
        {' · '}
        <PostsItemDate post={post} noStyles includeAgo />
        {(!post.fmCrosspost?.isCrosspost || post.fmCrosspost.hostedHere) && <span className={classes.readTime}>
          {' · '}{post.readTimeMinutes || 1}m read
        </span>}
      </div>
    </div>
  );
}

const EAPostMetaComponent = registerComponent(
  "EAPostMeta",
  EAPostMeta,
  {styles},
);

declare global {
  interface ComponentTypes {
    EAPostMeta: typeof EAPostMetaComponent,
  }
}
