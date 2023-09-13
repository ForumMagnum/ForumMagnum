import React, { CSSProperties } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import classNames from "classnames";

const styles = (_theme: ThemeType) => ({
  root: {
    fontSize: "1.1rem",
    lineHeight: "1.5em",
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
  },
});

const PostExcerpt = ({post, lines = 3, className, classes}: {
  post: PostsList,
  lines?: number,
  className?: string,
  classes: ClassesType,
}) => {
  if (!post.contents?.htmlHighlight) {
    return null;
  }

  // TODO: Add a 'More' button linking to the post
  const {ContentStyles, ContentItemBody} = Components;
  return (
    <ContentStyles
      contentType="postHighlight"
      className={classNames(classes.root, className)}
      style={{"-webkit-line-clamp": String(lines)} as CSSProperties}
    >
      <ContentItemBody dangerouslySetInnerHTML={{
        __html: post.contents?.htmlHighlight ?? "",
      }} />
    </ContentStyles>
  );
}

const PostExcerptComponent = registerComponent(
  "PostExcerpt",
  PostExcerpt,
  {styles, stylePriority: -1},
);

declare global {
  interface ComponentTypes {
    PostExcerpt: typeof PostExcerptComponent,
  }
}
