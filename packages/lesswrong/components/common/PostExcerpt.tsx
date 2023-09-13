import React, { CSSProperties } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { Link } from "../../lib/reactRouterWrapper";
import { postGetPageUrl } from "../../lib/collections/posts/helpers";
import classNames from "classnames";

const styles = (theme: ThemeType) => ({
  root: {
    position: "relative",
    fontSize: "1.1rem",
    lineHeight: "1.5em",
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
  },
  more: {
    position: "absolute",
    bottom: 0,
    right: 0,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontWeight: 500,
    paddingLeft: 30,
    background: `linear-gradient(
      90deg,
      ${theme.palette.inverseGreyAlpha(0.2)} 0%,
      ${theme.palette.inverseGreyAlpha(1.0)} 34%,
      ${theme.palette.inverseGreyAlpha(1.0)} 100%
    )`,
    "&:hover": {
      opacity: 1,
      color: `${theme.palette.primary.light} !important`,
    },
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
      <Link to={postGetPageUrl(post)} className={classes.more}>(More)</Link>
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
