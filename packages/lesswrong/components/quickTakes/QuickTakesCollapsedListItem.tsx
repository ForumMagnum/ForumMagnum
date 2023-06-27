import React, { useCallback } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useClickableCell, InteractionWrapper } from "../common/useClickableCell";
import { useHover } from "../common/withHover";
import { isMobile } from "../../lib/utils/isMobile";
import { postGetPageUrl } from "../../lib/collections/posts/helpers";
import { ExpandedDate } from "../common/FormatDate";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { HtmlToTextOptions, htmlToText } from "html-to-text";
import moment from "moment";

const styles = (theme: ThemeType) => ({
  root: {
    cursor: "pointer",
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
    whiteSpace: "nowrap",
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

const htmlToTextOptions: HtmlToTextOptions = {
  selectors: [
    {selector: "a", options: {ignoreHref: true}},
    {selector: "img", format: "skip"},
    {selector: "h1", options: {uppercase: false}},
    {selector: "h2", options: {uppercase: false}},
    {selector: "h3", options: {uppercase: false}},
    {selector: "h4", options: {uppercase: false}},
    {selector: "h5", options: {uppercase: false}},
    {selector: "h6", options: {uppercase: false}},
  ],
};

const QuickTakesCollapsedListItem = ({quickTake, setExpanded, classes}: {
  quickTake: ShortformComments,
  setExpanded: (expanded: boolean) => void,
  classes: ClassesType,
}) => {
  const {eventHandlers, hover, anchorEl} = useHover({
    pageElementContext: "shortformItemTooltip",
    commentId: quickTake._id,
  });

  const {onClick} = useClickableCell({onClick: () => setExpanded(true)});

  const commentCount = quickTake.descendentCount ?? 0;
  const primaryTag = quickTake.relevantTags?.[0];
  const displayHoverOver = hover && (quickTake.baseScore > -5) && !isMobile();

  const commentsUrl = quickTake.post
    ? `${postGetPageUrl(quickTake.post)}#${quickTake._id}`
    : undefined;

  const setShowEdit = useCallback(() => {
    if (commentsUrl) {
      window.location.href = commentsUrl;
    }
  }, [commentsUrl]);

  const {
    KarmaDisplay, ForumIcon, UsersName, LWTooltip, FooterTag, CommentsMenu,
    LWPopper, CommentsNode,
  } = Components;
  return (
    <div
      onClick={onClick}
      className={classes.root}
    >
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
          <InteractionWrapper className={classes.relevantTags}>
            {quickTake.relevantTags.map((tag) =>
              <FooterTag key={tag._id} tag={tag} smallText />
            )}
          </InteractionWrapper>
        }
        <div className={classes.grow} />
        <InteractionWrapper href={commentsUrl} className={classes.commentCount}>
          <ForumIcon icon="Comment" />
          {commentCount}
        </InteractionWrapper>
        <div>
          <InteractionWrapper>
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
          </InteractionWrapper>
        </div>
      </div>
      <div {...eventHandlers} className={classes.body}>
        {htmlToText(quickTake.contents?.html ?? "", htmlToTextOptions)}
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

const QuickTakesCollapsedListItemComponent = registerComponent(
  "QuickTakesCollapsedListItem",
  QuickTakesCollapsedListItem,
  {styles},
);

declare global {
  interface ComponentTypes {
    QuickTakesCollapsedListItem: typeof QuickTakesCollapsedListItemComponent
  }
}
