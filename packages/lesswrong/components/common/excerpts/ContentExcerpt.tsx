import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { Link } from "../../../lib/reactRouterWrapper";
import classNames from "classnames";
import { ContentStyleType } from "../ContentStyles";

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
  content: {
    "& h1": {fontSize: "16px !important"},
    "& h2": {fontSize: "16px !important"},
    "& h3": {fontSize: "16px !important"},
    "& h4": {fontSize: "16px !important"},
    "& h5": {fontSize: "16px !important"},
    "& h6": {fontSize: "16px !important"},
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
    "&:hover:not(:visited)": {
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
    <ContentStyles
      contentType={contentType}
      className={classNames(classes.root, className)}
      style={{WebkitLineClamp: lines}}
    >
      <ContentItemBody
        dangerouslySetInnerHTML={{__html: contentHtml}}
        className={classes.content}
      />
      <Link to={moreLink} className={classes.more}>(More)</Link>
    </ContentStyles>
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
