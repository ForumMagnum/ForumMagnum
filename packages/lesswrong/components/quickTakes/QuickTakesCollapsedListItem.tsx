import React, { useCallback } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { useClickableCell, InteractionWrapper } from "../common/useClickableCell";
import { useHover } from "../common/withHover";
import { isMobile } from "../../lib/utils/isMobile";
import { postGetPageUrl } from "../../lib/collections/posts/helpers";
import { ExpandedDate } from "../common/FormatDate";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { htmlToTextDefault } from "../../lib/htmlToText";
import classNames from "classnames";
import moment from "moment";
import KarmaDisplay from "../common/KarmaDisplay";
import ForumIcon from "../common/ForumIcon";
import UsersName from "../users/UsersName";
import LWTooltip from "../common/LWTooltip";
import FooterTag from "../tagging/FooterTag";
import CommentsMenu from "../dropdowns/comments/CommentsMenu";
import LWPopper from "../common/LWPopper";
import CommentsNodeInner from "../comments/CommentsNode";

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
  },
  commentCountClickable: {
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
    fontSize: "1.1rem",
    lineHeight: "1.5em",
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

const QuickTakesCollapsedListItem = ({quickTake, setExpanded, classes}: {
  quickTake: ShortformComments,
  setExpanded: (expanded: boolean) => void,
  classes: ClassesType<typeof styles>,
}) => {
  const {eventHandlers, hover, anchorEl} = useHover({
    eventProps: {
      pageElementContext: "shortformItemTooltip",
      commentId: quickTake._id,
    },
  });

  const {onClick} = useClickableCell({onClick: () => setExpanded(true)});

  const commentCount = quickTake.descendentCount ?? 0;
  const commentsAreClickable = commentCount > 0;
  const primaryTag = quickTake.relevantTags?.[0];
  const displayHoverOver = hover && (quickTake.baseScore ?? 0) > -5 && !isMobile();

  const commentsUrl = quickTake.post
    ? `${postGetPageUrl(quickTake.post)}#${quickTake._id}`
    : undefined;

  const setShowEdit = useCallback(() => {
    if (commentsUrl) {
      window.location.href = commentsUrl;
    }
  }, [commentsUrl]);

  const onClickComments = useCallback(() => {
    if (commentsAreClickable) {
      // Clicking also expands the item - setTimeout allows us to make sure
      // this runs _after_ the expansion is already complete
      setTimeout(() => {
        const {_id} = quickTake;
        const children = document.querySelector(`#${_id} .comments-children`);
        children?.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
      }, 0);
    }
  }, [commentsAreClickable, quickTake]);
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
              <FooterTag key={tag._id} tag={tag} smallText hoverable={true} />
            )}
          </InteractionWrapper>
        }
        <div className={classes.grow} />
        <div
          onClick={onClickComments}
          className={classNames(classes.commentCount, {
            [classes.commentCountClickable]: commentsAreClickable,
          })}
        >
          <ForumIcon icon="Comment" />
          {commentCount}
        </div>
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
        {quickTake.contents?.plaintextMainText}
      </div>
      <LWPopper
        open={displayHoverOver}
        anchorEl={anchorEl}
        placement="bottom-end"
        clickable={false}
      >
        <div className={classes.hoverOver}>
          <CommentsNodeInner
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

export default registerComponent(
  "QuickTakesCollapsedListItem",
  QuickTakesCollapsedListItem,
  {styles},
);


