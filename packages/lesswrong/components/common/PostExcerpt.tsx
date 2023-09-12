import React from "react";
import { registerComponent } from "../../lib/vulcan-lib";
import { htmlToTextTruncated } from "../../lib/htmlToText";
import classNames from "classnames";

const styles = (_theme: ThemeType) => ({
  root: {
    fontSize: "1.1rem",
    lineHeight: "1.5em",
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
    "-webkit-line-clamp": 3,
  },
});

const PostExcerpt = ({post, className, classes}: {
  post: PostsList,
  className?: string,
  classes: ClassesType,
}) => {
  // TODO: Add a 'More' button linking to the post
  return (
    <div className={classNames(classes.root, className)}>
      {htmlToTextTruncated(post.contents?.htmlHighlight)}
    </div>
  );
}

const PostExcerptComponent = registerComponent(
  "PostExcerpt",
  PostExcerpt,
  {styles},
);

declare global {
  interface ComponentTypes {
    PostExcerpt: typeof PostExcerptComponent,
  }
}
