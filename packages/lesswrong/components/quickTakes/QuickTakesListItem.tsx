import React, { useCallback, useState } from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { ExpandedDate } from "../common/FormatDate";
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";
import { useHover } from "../common/withHover";
import { isMobile } from "../../lib/utils/isMobile";
import { postGetPageUrl } from "../../lib/collections/posts/helpers";
import { htmlToText } from "html-to-text";
import moment from "moment";

const styles = (theme: ThemeType) => ({
  root: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
    fontWeight: 500,
    color: theme.palette.grey[1000],
    background: theme.palette.grey[0],
    border: `1px solid ${theme.palette.grey[200]}`,
    padding: 12,
    paddingTop: 12,
    borderRadius: theme.borderRadius.default,
  },
  expandedRoot: {
    "& .comments-node-root": {
      marginBottom: 0,
    },
  },
  info: {
    display: "flex",
    alignItems: "baseline",
    gap: "8px",
    marginBottom: 8,
  },
  grow: {
    flexGrow: 1,
  },
  karma: {
    color: theme.palette.grey[600],
    display: "flex",
    alignItems: "center",
    gap: "4px",
    "& svg": {
      width: 9,
    },
  },
  username: {
    fontWeight: 600,
  },
  date: {
    color: theme.palette.grey[600],
  },
  relevantTags: {
    display: "flex",
    flexWrap: "wrap",
    rowGap: "100px",
    overflow: "hidden",
    maxHeight: 20,
  },
  commentCount: {
    color: theme.palette.grey[600],
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    "& svg": {
      height: 14,
    },
    "&:hover": {
      color: theme.palette.grey[1000],
    },
  },
  menu: {
    color: theme.palette.grey[600],
    cursor: "pointer",
    "& svg": {
      height: 18,
      transform: "translateY(2px)",
    },
    "&:hover": {
      color: theme.palette.grey[1000],
    },
  },
  body: {
    cursor: "pointer",
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
    "-webkit-line-clamp": 2,
    [theme.breakpoints.down("xs")]: {
      "-webkit-line-clamp": 3,
    },
  },
  hoverOver: {
    width: 400,
  },
});

const QuickTakesListItem = ({quickTake, classes}: {
  quickTake: ShortformComments,
  classes: ClassesType,
}) => {
  const {captureEvent} = useTracking();
  const [expanded, setExpanded] = useState(false)
  const wrappedSetExpanded = useCallback((value: boolean) => {
    setExpanded(value);
    captureEvent(value ? "shortformItemExpanded" : "shortformItemCollapsed");
  }, [captureEvent, setExpanded]);
  const {eventHandlers, hover, anchorEl} = useHover({
    pageElementContext: "shortformItemTooltip",
    commentId: quickTake._id,
  });

  const commentCount = quickTake.descendentCount ?? 0;
  const primaryTag = quickTake.relevantTags?.[0];
  const displayHoverOver = hover && (quickTake.baseScore > -5) && !isMobile();

  const {
    LWTooltip, LWPopper, KarmaDisplay, UsersName, FooterTag, CommentsMenu,
    ForumIcon, CommentsNode,
  } = Components;


  if (expanded) {
    return (
      <div className={classes.expandedRoot}>
        <CommentsNode
          treeOptions={{
            post: quickTake.post || undefined,
            showCollapseButtons: true,
            onToggleCollapsed: () => wrappedSetExpanded(!expanded),
          }}
          comment={quickTake}
          loadChildrenSeparately
        />
      </div>
    );
  }

  const commentsUrl = quickTake.post
    ? `${postGetPageUrl(quickTake.post)}#${quickTake._id}`
    : undefined;

  const setShowEdit = () => {
    if (commentsUrl) {
      window.location.href = commentsUrl;
    }
  }

  return (
    <div className={classes.root}>
      <div className={classes.info}>
        <div className={classes.karma}>
          <KarmaDisplay document={quickTake} />
          <ForumIcon icon="SoftUpArrow" />
        </div>
        <UsersName user={quickTake.user} className={classes.username} />
        <div className={classes.date}>
          <LWTooltip
            placement="right"
            title={<ExpandedDate date={quickTake.postedAt} />}
          >
            {moment(new Date(quickTake.postedAt)).fromNow()}
          </LWTooltip>
        </div>
        {quickTake.relevantTags.length > 0 &&
          <div className={classes.relevantTags}>
            {quickTake.relevantTags.map((tag) =>
              <FooterTag key={tag._id} tag={tag} smallText />
            )}
          </div>
        }
        <div className={classes.grow} />
        <a href={commentsUrl} className={classes.commentCount}>
          <ForumIcon icon="Comment" />
          {commentCount}
        </a>
        <div>
          <AnalyticsContext pageElementContext="tripleDotMenu">
            <CommentsMenu
              className={classes.menu}
              comment={quickTake}
              post={quickTake.post ?? undefined}
              tag={primaryTag}
              icon={<ForumIcon icon="EllipsisVertical" />}
              showEdit={setShowEdit}
            />
          </AnalyticsContext>
        </div>
      </div>
      <div
        {...eventHandlers}
        onClick={() => wrappedSetExpanded(true)}
        className={classes.body}
      >
        {htmlToText(quickTake.contents?.html ?? "", {
          selectors: [
            {selector: "a", options: {ignoreHref: true}},
            {selector: "img", format: "skip"},
          ],
        })}
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
            comment={quickTake}
            treeOptions={{
              post: quickTake.post || undefined,
              showCollapseButtons: true,
              onToggleCollapsed: () => wrappedSetExpanded(!expanded),
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

const QuickTakesListItemComponent = registerComponent(
  "QuickTakesListItem",
  QuickTakesListItem,
  {styles},
);

declare global {
  interface ComponentTypes {
    QuickTakesListItem: typeof QuickTakesListItemComponent
  }
}
