import React, { useCallback, useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { ExpandedDate } from "../common/FormatDate";
import { Link } from "../../lib/reactRouterWrapper";
import { postGetPageUrl } from "../../lib/collections/posts/helpers";
import { commentGetPageUrl } from "../../lib/collections/comments/helpers";
import { Comments } from "../../lib/collections/comments";
import { htmlToTextDefault } from "../../lib/htmlToText";
import { InteractionWrapper, useClickableCell } from "../common/useClickableCell";
import { useTracking } from "../../lib/analyticsEvents";
import classNames from "classnames";
import moment from "moment";

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    color: theme.palette.greyAlpha(0.5),
    background: theme.palette.grey[0],
    borderRadius: theme.borderRadius.default,
    border: `1px solid ${theme.palette.grey[200]}`,
    padding: "8px 12px",
    cursor: "pointer",
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  post: {
    color: theme.palette.grey[600],
    fontWeight: 600,
  },
  link: {
    color: theme.palette.primary.main,
    fontWeight: 600,
    "&:hover": {
      opacity: 1,
      color: theme.palette.primary.light,
    },
  },
  username: {
    fontWeight: 600,
    whiteSpace: "nowrap",
    color: theme.palette.grey[1000],
  },
  date: {
    color: theme.palette.grey[600],
  },
  body: {
    lineHeight: "160%",
    letterSpacing: "-0.14px",
    color: theme.palette.grey[1000],
  },
  bodyCollapsed: {
    position: "relative",
    overflow: "hidden",
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
    "-webkit-line-clamp": 2,
    // Maybe we revist this in the future - Figma designs had a "Read more"
    // but this is spectacularly difficult
    // "&::before": {
      // content: '"(Show more)"',
      // float: "right",
      // marginTop: "1.5em",
      // color: theme.palette.primary.main,
      // fontWeight: 600,
      // "&:hover": {
        // color: theme.palette.primary.light,
      // },
    // },
  },
});

const PopularComment = ({comment, classes}: {
  comment: CommentsListWithParentMetadata,
  classes: ClassesType,
}) => {
  const {captureEvent} = useTracking();
  const [expanded, setExpanded] = useState(false);

  const onClickCallback = useCallback(() => {
    setExpanded(!expanded);
    captureEvent("popularCommentToggleExpanded", {expanded: !expanded});
  }, [expanded, captureEvent]);

  const {onClick} = useClickableCell({onClick: onClickCallback});

  const {UsersName, LWTooltip, SmallSideVote} = Components;
  return (
    <div onClick={onClick} className={classes.root}>
      {comment.post &&
        <div className={classes.row}>
          <Link to={postGetPageUrl(comment.post)} className={classes.post}>
            {comment.post?.title}
          </Link>
          <Link to={commentGetPageUrl(comment)} className={classes.link}>
            View in thread
          </Link>
        </div>
      }
      <div className={classes.row}>
        <UsersName user={comment.user} className={classes.username} />
        <div className={classes.date}>
          <LWTooltip
            placement="right"
            title={<ExpandedDate date={comment.postedAt} />}
          >
            {moment(new Date(comment.postedAt)).fromNow()}
          </LWTooltip>
        </div>
        {!comment.debateResponse && !comment.rejected &&
          <InteractionWrapper>
            <SmallSideVote
              document={comment}
              collection={Comments}
              hideKarma={comment.post?.hideCommentKarma}
            />
          </InteractionWrapper>
        }
      </div>
      {expanded
        ? (
          <div
            dangerouslySetInnerHTML={{__html: comment.contents?.html ?? ""}}
            className={classes.body}
          />
        )
        : (
          <div className={classNames(classes.body, classes.bodyCollapsed)}>
            {htmlToTextDefault(comment.contents?.html)}
          </div>
        )
      }
    </div>
  );
}

const PopularCommentComponent = registerComponent(
  "PopularComment",
  PopularComment,
  {styles},
);

declare global {
  interface ComponentTypes {
    PopularComment: typeof PopularCommentComponent
  }
}
