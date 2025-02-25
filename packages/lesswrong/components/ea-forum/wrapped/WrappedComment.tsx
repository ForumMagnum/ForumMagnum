import React from "react";
import { Components, registerComponent } from "@/lib/vulcan-lib/components.tsx";
import { Link } from "@/lib/reactRouterWrapper";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { ExpandedDate } from "@/components/common/FormatDate";
import { SoftUpArrowIcon } from "@/components/icons/softUpArrowIcon";
import { htmlToTextDefault } from "@/lib/htmlToText";
import {
  WrappedTopComment,
  WrappedTopShortform,
  useForumWrappedContext,
} from "./hooks";
import type { TagCommentType } from "@/lib/collections/comments/types";
import moment from "moment";
import { commentGetPageUrlFromIds } from "@/lib/collections/comments/helpers";

const styles = (theme: ThemeType) => ({
  root: {
    background: theme.palette.wrapped.darkBackground,
    textAlign: "left",
    border: `1px solid ${theme.palette.wrapped.black}`,
    borderRadius: theme.borderRadius.default,
    padding: "8px 12px",
  },
  postTitle: {
    fontSize: 12,
    lineHeight: "17px",
    color: theme.palette.wrapped.metaText,
    marginBottom: 6,
    overflow: "hidden",
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
    "-webkit-line-clamp": 2,
  },
  meta: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "2px 8px",
    color: theme.palette.wrapped.metaText,
    "& .EAReactsSection-button": {
      color: theme.palette.wrapped.metaText,
    },
  },
  author: {
    color: theme.palette.text.alwaysWhite,
    fontSize: 14,
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  score: {
    flexGrow: 1,
    display: "flex",
    alignItems: "center",
    gap: "6px",
    pointerEvents: "none",
  },
  karma: {
    display: "flex",
    gap: "5px",
    fontWeight: 500,
  },
  voteArrow: {
    transform: "translateY(-2px)",
  },
  reacts: {
    display: "flex",
  },
  body: {
    color: theme.palette.wrapped.metaText,
    overflow: "hidden",
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
    "-webkit-line-clamp": 5,
  },
});

/**
 * A single comment item, used in TopCommentSection and TopShortformSection
 */
const WrappedComment = ({comment, classes}: {
  comment: WrappedTopComment | WrappedTopShortform,
  classes: ClassesType<typeof styles>,
}) => {
  const {currentUser} = useForumWrappedContext();
  
  const url = commentGetPageUrlFromIds({
    postId: comment.postId,
    postSlug: "postSlug" in comment ? comment.postSlug : "",
    commentId: comment._id,
    tagCommentType: "DISCUSSION" as TagCommentType,
  });

  const {LWTooltip, EAReactsSection, UserTooltip, ContentStyles} = Components;
  return (
    <article className={classes.root}>
      {"postTitle" in comment &&
        <div className={classes.postTitle}>
          <Link to={postGetPageUrl({_id: comment.postId, slug: comment.postSlug})}>
            {comment.postTitle}
          </Link>
        </div>
      }
      <div className={classes.meta}>
        <div className={classes.author}>
          <UserTooltip user={currentUser} placement="bottom">
            {currentUser?.displayName}
          </UserTooltip>
        </div>
        <div>
          <LWTooltip
            placement="right"
            title={<ExpandedDate date={comment.postedAt} />}
          >
            <Link target="_blank" rel="nofollow" to={url}>
              {moment(new Date(comment.postedAt)).fromNow()}
            </Link>
          </LWTooltip>
        </div>
        <div className={classes.karma}>
          <div className={classes.voteArrow}>
            <SoftUpArrowIcon />
          </div>
          {comment.baseScore}
        </div>
        <div className={classes.reacts}>
          <EAReactsSection
            document={comment}
            voteProps={{document: comment}}
            viewOnly
          />
        </div>
      </div>
      <ContentStyles contentType="comment">
        <div className={classes.body}>
          {htmlToTextDefault(comment.contents.html)}
        </div>
      </ContentStyles>
    </article>
  );
}

const WrappedCommentComponent = registerComponent(
  "WrappedComment",
  WrappedComment,
  {styles},
);

declare global {
  interface ComponentTypes {
    WrappedComment: typeof WrappedCommentComponent
  }
}
