import React, { useState } from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { SECTION_WIDTH } from "../common/SingleColumnSection";
import { SoftUpArrowIcon } from "../icons/softUpArrowIcon";
import { ExpandedDate } from "../common/FormatDate";
import withErrorBoundary from "../common/withErrorBoundary";
import moment from "moment";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    maxWidth: SECTION_WIDTH,
    display: "flex",
    alignItems: "center",
    background: theme.palette.grey[0],
    border: `1px solid ${theme.palette.grey[100]}`,
    borderRadius: theme.borderRadius.default,
    padding: 8 12,
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
  karma: {
    display: "flex",
    alignItems: "center",
    "& svg": {
      marginLeft: 4,
    },
  },
  shortformIcon: {
    display: "flex",
    marginLeft: 4,
    color: theme.palette.grey[1000],
    "& svg": {
      height: 16,
    },
  },
  author: {
    whiteSpace: "nowrap",
    marginLeft: 2,
    color: theme.palette.grey[1000],
    fontWeight: 600,
    lintHeight: "17px",
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
  },
  preview: {
    marginLeft: 6,
    whiteSpace: "nowrap",
    overflowX: "hidden",
    textOverflow: "ellipsis",
    color: theme.palette.grey[1000],
  },
});

const ShortformListItem = ({comment, hideTag, classes}: {
  comment: ShortformComments,
  hideTag?: boolean,
  classes: ClassesType,
}) => {
  const karma = comment.baseScore ?? 0;
  const commentCount = comment.descendentCount ?? 0;
  const primaryTag = comment.relevantTags?.[0];
  const [expanded, setExpanded] = useState(false)

  const { LWTooltip, ForumIcon, UsersName, FooterTag, CommentsNode } = Components;
  
  if (expanded) {
    return <CommentsNode
      treeOptions={{
        post: comment.post || undefined,
      }}
      comment={comment}
      loadChildrenSeparately
    />
  }

  return (
    <div className={classes.root} onClick={() => setExpanded(true)}>
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
      <div className={classes.shortformIcon}>
        {comment.shortform && <ForumIcon icon="Shortform" />}
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
        {!hideTag && primaryTag && <FooterTag tag={primaryTag} smallText />}
      </div>
      <div className={classes.preview}>
        {comment.contents?.plaintextMainText}
      </div>
    </div>
  );
}

const ShortformListItemComponent = registerComponent(
  "ShortformListItem",
  ShortformListItem, {
    styles,
    hocs: [withErrorBoundary],
    areEqual: {
      treeOptions: "shallow",
    },
  },
);

declare global {
  interface ComponentTypes {
    ShortformListItem: typeof ShortformListItemComponent,
  }
}
