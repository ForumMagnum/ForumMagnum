import React, { useCallback, useState } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { SECTION_WIDTH } from "../common/SingleColumnSection";
import { SoftUpArrowIcon } from "../icons/softUpArrowIcon";
import { ExpandedDate } from "../common/FormatDate";
import { useHover } from "../common/withHover";
import { isMobile } from "../../lib/utils/isMobile";
import withErrorBoundary from "../common/withErrorBoundary";
import moment from "moment";
import { useTracking } from "../../lib/analyticsEvents";
import LWPopper from "../common/LWPopper";
import LWTooltip from "../common/LWTooltip";
import ForumIcon from "../common/ForumIcon";
import UsersName from "../users/UsersName";
import FooterTag from "../tagging/FooterTag";
import CommentsNode from "../comments/CommentsNode";

const styles = (theme: ThemeType) => ({
  root: {
    maxWidth: SECTION_WIDTH,
    display: "flex",
    alignItems: "center",
    background: theme.palette.grey[0],
    border: `1px solid ${theme.palette.grey[100]}`,
    borderRadius: theme.borderRadius.default,
    padding: "8px 12px",
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontWeight: 500,
    fontSize: 14,
    color: theme.palette.grey[600],
    cursor: "pointer",
    "&:hover": {
      background: theme.palette.grey[50],
      border: `1px solid ${theme.palette.grey[250]}`,
    },
  },
  expandedRoot: {
    "& .comments-node-root": {
      marginBottom: 8,
    },
  },
  karma: {
    display: "flex",
    alignItems: "center",
    justifyContent: "end",
    minWidth: 40,
    paddingRight: 7,
    "& svg": {
      marginLeft: 5,
    },
  },
  author: {
    whiteSpace: "nowrap",
    marginLeft: 2,
    color: theme.palette.grey[1000],
    fontWeight: 600,
  },
  date: {
    marginLeft: 10,
  },
  comments: {
    display: "flex",
    alignItems: "center",
    marginLeft: 8,
    "& svg": {
      height: 16,
    },
  },
  tag: {
    marginLeft: 10,
    [theme.breakpoints.down("xs")]: {
      display: "none",
    }
  },
  preview: {
    marginLeft: 6,
    whiteSpace: "nowrap",
    overflowX: "hidden",
    textOverflow: "ellipsis",
    color: theme.palette.grey[1000],
  },
  hoverOver: {
    width: 400,
  },
});

const ShortformListItem = ({comment, hideTag, classes}: {
  comment: ShortformComments,
  hideTag?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const { captureEvent } = useTracking();

  const [expanded, setExpanded] = useState(false)
  const wrappedSetExpanded = useCallback((value: boolean) => {
    setExpanded(value);
    captureEvent(value ? "shortformItemExpanded" : "shortformItemCollapsed");
  }, [captureEvent, setExpanded]);

  const {eventHandlers, hover, anchorEl} = useHover({
    eventProps: {
      pageElementContext: "shortformItemTooltip",
      commentId: comment._id,
    },
  });

  const treeOptions = {
    post: comment.post || undefined,
    showCollapseButtons: true,
    onToggleCollapsed: () => wrappedSetExpanded(!expanded),
  };
  if (expanded) {
    return (
      <div className={classes.expandedRoot}>
        <CommentsNode
          treeOptions={treeOptions}
          comment={comment}
          loadChildrenSeparately
        />
      </div>
    );
  }

  const karma = comment.baseScore ?? 0;
  const commentCount = comment.descendentCount ?? 0;
  const primaryTag = comment.relevantTags?.[0];
  const displayHoverOver = hover && (karma > -5) && !isMobile();

  return (
    <div
      className={classes.root}
      onClick={() => wrappedSetExpanded(true)}
      {...eventHandlers}
    >
      <div className={classes.karma}>
        <LWTooltip title={
          <div>
            <div>{karma} karma</div>
            <div>({comment.voteCount} votes)</div>
          </div>
        }>
          {karma}
        </LWTooltip>
        <SoftUpArrowIcon />
      </div>
      <div className={classes.author}>
        <UsersName user={comment.user} />
      </div>
      <div className={classes.date}>
        <LWTooltip
          placement="right"
          title={<ExpandedDate date={comment.postedAt} />}
        >
          {moment(new Date(comment.postedAt)).fromNow()}
        </LWTooltip>
      </div>
      {commentCount > 0 &&
        <div className={classes.comments}>
            <ForumIcon icon="Comment" />
            {commentCount}
        </div>
      }
      <div className={classes.tag}>
        {!hideTag && primaryTag && <FooterTag tag={primaryTag} smallText hoverable={true} />}
      </div>
      <div className={classes.preview}>
        {comment.contents?.plaintextMainText}
      </div>
      <LWPopper
        open={displayHoverOver}
        anchorEl={anchorEl}
        placement="bottom-end"
        clickable={false}
      >
        <div className={classes.hoverOver}>
          <CommentsNode
            truncated
            nestingLevel={1}
            comment={comment}
            treeOptions={{
              ...treeOptions,
              hideReply: true,
              forceSingleLine: false,
              forceNotSingleLine: true,
            }}
            hoverPreview
          />
        </div>
      </LWPopper>
    </div>
  );
}

export default registerComponent(
  "ShortformListItem",
  ShortformListItem, {
    styles,
    hocs: [withErrorBoundary],
    areEqual: {
      treeOptions: "shallow",
    },
  },
);


