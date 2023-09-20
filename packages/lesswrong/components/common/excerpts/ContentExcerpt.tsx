import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { Link } from "../../../lib/reactRouterWrapper";
import type { ContentStyleType } from "../ContentStyles";
import classNames from "classnames";

const HTML_CHARS_PER_LINE_HEURISTIC = 120;

const contentTypeMap: Record<ContentStyleType, string> = {
  post: "post",
  postHighlight: "post",
  comment: "comment",
  commentExceptPointerEvents: "comment",
  answer: "answer",
  tag: "tag",
  debateResponse: "debate response",
};

const styles = (theme: ThemeType) => ({
  root: {
  },
  excerpt: {
    position: "relative",
    fontSize: "1.1rem",
    lineHeight: "1.5em",
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
  },
  content: {
    "& h1": {fontSize: "16px !important"},
    "& h2": {fontSize: "16px !important"},
    "& h3": {fontSize: "16px !important"},
    "& h4": {fontSize: "16px !important"},
    "& h5": {fontSize: "16px !important"},
    "& h6": {fontSize: "16px !important"},
  },
  continueReading: {
    display: "block",
    marginTop: 12,
    color: theme.palette.primary.main,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
    fontWeight: 500,
    "&:hover": {
      opacity: 1,
      color: `${theme.palette.primary.light} !important`,
    },
  },
});

const ContentExcerpt = ({
  contentHtml,
  moreLink,
  lines = 3,
  contentType,
  className,
  classes,
}: {
  contentHtml: string,
  moreLink: string,
  contentType: ContentStyleType,
  lines?: number,
  className?: string,
  classes: ClassesType,
}) => {
  const {ContentStyles, ContentItemBody} = Components;
  return (
    <div className={classNames(classes.root, className)}>
      <ContentStyles
        contentType={contentType}
        className={classes.excerpt}
        style={{WebkitLineClamp: lines}}
      >
        <ContentItemBody
          dangerouslySetInnerHTML={{__html: contentHtml}}
          className={classes.content}
        />
      </ContentStyles>
      <Link to={moreLink} className={classes.continueReading}>
        {contentHtml.length > HTML_CHARS_PER_LINE_HEURISTIC * lines
          ? "Continue reading"
          : `View ${contentTypeMap[contentType]}`
        }
      </Link>
    </div>
  );
}

const ContentExcerptComponent = registerComponent(
  "ContentExcerpt",
  ContentExcerpt,
  {styles, stylePriority: -1},
);

declare global {
  interface ComponentTypes {
    ContentExcerpt: typeof ContentExcerptComponent,
  }
}
