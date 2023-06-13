import React from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import moment from "moment";
import { ExpandedDate } from "../common/FormatDate";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { useHover } from "../common/withHover";
import { isMobile } from "../../lib/utils/isMobile";

const styles = (theme: ThemeType) => ({
  root: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
    fontWeight: 500,
    color: theme.palette.grey[1000],
    background: theme.palette.grey[0],
    border: `1px solid ${theme.palette.grey[200]}`,
    padding: 12,
    paddingTop: 18,
    borderRadius: theme.borderRadius.default,
  },
  info: {
    display: "flex",
    alignItems: "baseline",
    gap: "8px",
    marginBottom: 14,
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
  const {eventHandlers, hover, anchorEl} = useHover({
    pageElementContext: "shortformItemTooltip",
    commentId: quickTake._id,
  });

  const commentCount = quickTake.descendentCount ?? 0;
  const primaryTag = quickTake.relevantTags?.[0];
  const displayHoverOver = hover && (quickTake.baseScore > -5) && !isMobile();

  const setShowEdit = () => {}; // TODO

  const {
    LWTooltip, LWPopper, KarmaDisplay, UsersName, FooterTag, CommentsMenu,
    ForumIcon, ContentItemBody, CommentsNode,
  } = Components;
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
        {primaryTag &&
          <FooterTag tag={primaryTag} smallText />
        }
        <div className={classes.grow} />
        <div className={classes.commentCount}>
          <ForumIcon icon="Comment" />
          {commentCount}
        </div>
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
      <div {...eventHandlers}>
        <ContentItemBody
          dangerouslySetInnerHTML={{__html: quickTake.contents?.html ?? ""}}
          className={classes.body}
        />
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
              // onToggleCollapsed: () => wrappedSetExpanded(!expanded),
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
