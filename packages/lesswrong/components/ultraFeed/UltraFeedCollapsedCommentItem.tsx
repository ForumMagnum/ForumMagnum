import React, { useCallback } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { DisplayFeedComment } from "./ultraFeedTypes";
import type { PostsMinimumInfo } from "../../lib/collections/posts/fragments";
import { isFriendlyUI } from "../../themes/forumTheme";
import classNames from "classnames";
// import { ultraFeedCommentItemCommonStyles } from "./UltraFeedCommentItem";

export const SINGLE_LINE_PADDING_TOP = 5;

const styles = defineStyles("UltraFeedCollapsedCommentItem", (theme: ThemeType) => ({
  root: {
    // ...ultraFeedCommentItemCommonStyles(theme),
    paddingLeft: 12,
    paddingRight: 12,
    cursor: "pointer",
    paddingBottom: 10,
  },
  contentWrapper: {
    cursor: "pointer",
  },
  content: {
    // marginBottom: 16,
  },
  truncatedContent: {
    overflow: "hidden",
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
    "-webkit-line-clamp": 2,
    flexGrow: 1,
    textOverflow: "ellipsis",
    lineHeight: 1.4,
    '& *': {
      display: "inline"
    },
    '& blockquote, & br, & figure, & img': {
      display: "none"
    },
    '& p': {
      marginRight: 6,
      marginTop: 0,
      marginBottom: 0,
    },
    '& strong': {
      fontWeight: theme.typography.body2.fontWeight
    }
  },
}));

const UltraFeedCollapsedCommentItem = ({
  commentWithMetaInfo,
  post,
  setExpanded
}: {
  commentWithMetaInfo: DisplayFeedComment,
  post: PostsMinimumInfo,
  setExpanded: (value: boolean) => void
}) => {
  const classes = useStyles(styles);
  const { UltraFeedCommentsItemMeta, ContentStyles } = Components;
  
  const handleClick = useCallback(() => {
    setExpanded(true);
  }, [setExpanded]);
  
  return (
    <div className={classes.root} onClick={handleClick}>
      <UltraFeedCommentsItemMeta 
        commentWithMetaInfo={commentWithMetaInfo}
        post={post}
        hideDate={true}
        hideVoteButtons={true}
        hideActionsMenu={true}
      />
      <div className={classes.contentWrapper}>
        <ContentStyles 
          contentType="comment" 
          className={classNames( classes.content, classes.truncatedContent)}
        >
          <div dangerouslySetInnerHTML={{ __html: commentWithMetaInfo.comment.contents?.html || '' }} />
        </ContentStyles>
      </div>
    </div>
  );
};

const UltraFeedCollapsedCommentItemComponent = registerComponent(
  "UltraFeedCollapsedCommentItem",
  UltraFeedCollapsedCommentItem
);

export default UltraFeedCollapsedCommentItemComponent;

declare global {
  interface ComponentTypes {
    UltraFeedCollapsedCommentItem: typeof UltraFeedCollapsedCommentItemComponent
  }
} 
