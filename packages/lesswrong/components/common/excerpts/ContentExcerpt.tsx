import React, { useCallback, useState } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib/components";
import { Link } from "../../../lib/reactRouterWrapper";
import type { ContentStyleType } from "../ContentStyles";
import classNames from "classnames";
import { truncate } from "../../../lib/editor/ellipsize";

const HTML_CHARS_PER_LINE_HEURISTIC = 120;
const EXPAND_IN_PLACE_LINES = 10;

const contentTypeMap: Record<ContentStyleType, string> = {
  post: "post",
  postHighlight: "post",
  comment: "comment",
  commentExceptPointerEvents: "comment",
  answer: "answer",
  tag: "tag",
  debateResponse: "debate response",
  llmChat: "llm chat",
  ultraFeed: "content",
};

const normalHeading = {
  fontSize: "16px !important",
};

const smallHeading = {
  fontSize: "14px !important",
  fontWeight: 700,
};

const styles = (theme: ThemeType) => ({
  root: {},
  excerpt: {
    position: "relative",
    fontSize: "1.1rem",
    lineHeight: "1.5em",
  },
  contentNormalText: {
    "& h1": normalHeading,
    "& h2": normalHeading,
    "& h3": normalHeading,
    "& h4": normalHeading,
    "& h5": normalHeading,
    "& h6": normalHeading,
  },
  contentSmallText: {
    "& h1": smallHeading,
    "& h2": smallHeading,
    "& h3": smallHeading,
    "& h4": smallHeading,
    "& h5": smallHeading,
    "& h6": smallHeading,
    "& p": {
      fontSize: "13px !important",
    },
  },
  contentNoLinkStyling: {
    "& a": {
      color: `${theme.palette.text.normal} !important`,
    },
  },
  contentHideMultimedia: {
    "& iframe, & img, & video": {
      display: "none",
    },
  },
  continueReading: {
    cursor: "pointer",
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

export type CommonExcerptProps = {
  lines?: number,
  hideMoreLink?: boolean,
  smallText?: boolean,
  noLinkStyling?: boolean,
  hideMultimedia?: boolean,
  className?: string,
}

const ContentExcerptInner = ({
  contentHtml,
  moreLink,
  hideMoreLink,
  smallText,
  noLinkStyling,
  hideMultimedia,
  lines = 3,
  alwaysExpandInPlace,
  contentType,
  className,
  classes,
}: CommonExcerptProps & {
  contentHtml: string,
  moreLink: string,
  contentType: ContentStyleType,
  alwaysExpandInPlace?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const [expanded, setExpanded] = useState(false);

  const onExpand = useCallback(() => setExpanded(true), []);

  const isTruncated = contentHtml.length > HTML_CHARS_PER_LINE_HEURISTIC * lines;
  const expandInPlace = alwaysExpandInPlace ||
    contentHtml.length < HTML_CHARS_PER_LINE_HEURISTIC * EXPAND_IN_PLACE_LINES;

  // We use `truncate` here rather than webkit-box overflow shenanigans
  // because of bugs in certain versions of ios safari
  const truncatedHtml = truncate(
    contentHtml,
    Math.floor(lines * HTML_CHARS_PER_LINE_HEURISTIC),
    "characters",
    "...",
    false,
  );

  const {ContentStyles, ContentItemBody} = Components;
  return (
    <div className={classNames(classes.root, className)}>
      <ContentStyles
        contentType={contentType}
        className={classes.excerpt}
      >
        <ContentItemBody
          dangerouslySetInnerHTML={{__html: expanded ? contentHtml : truncatedHtml}}
          className={classNames({
            [classes.contentNormalText]: !smallText,
            [classes.contentSmallText]: smallText,
            [classes.contentNoLinkStyling]: noLinkStyling,
            [classes.contentHideMultimedia]: hideMultimedia,
          })}
        />
      </ContentStyles>
      {!hideMoreLink && (expandInPlace
        ? (
          expanded
            ? null
            : (
              <div onClick={onExpand} className={classes.continueReading}>
                Continue reading
              </div>
            )
        )
        : (
          <Link to={moreLink} className={classes.continueReading} eventProps={{intent: 'expandPost'}}>
            {isTruncated
              ? "Continue reading"
              : `View ${contentTypeMap[contentType]}`
            }
          </Link>
        )
      )}
    </div>
  );
}

export const ContentExcerpt = registerComponent(
  "ContentExcerpt",
  ContentExcerptInner,
  {styles, stylePriority: -1},
);

declare global {
  interface ComponentTypes {
    ContentExcerpt: typeof ContentExcerpt,
  }
}
