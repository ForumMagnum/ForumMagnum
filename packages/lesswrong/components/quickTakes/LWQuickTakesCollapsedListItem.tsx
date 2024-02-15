import React, { useCallback } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useClickableCell, InteractionWrapper } from "../common/useClickableCell";
import { useHover } from "../common/withHover";
import { isMobile } from "../../lib/utils/isMobile";
import { postGetPageUrl } from "../../lib/collections/posts/helpers";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { htmlToTextDefault } from "../../lib/htmlToText";
import classNames from "classnames";
import { Comments } from "../../lib/collections/comments";
import { commentBodyStyles } from "../../themes/stylePiping";

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    color: theme.palette.greyAlpha(0.5),
    background: theme.palette.grey[0],
    borderRadius: theme.borderRadius.default,
    border: `1px solid ${theme.palette.grey[200]}`,
    padding: ".6em 12px",
  },
  info: {
    display: "flex",
    alignItems: "center",
    marginBottom: 8,
  },
  grow: {
    flexGrow: 1,
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
  link: {
    color: theme.palette.primary.main,
    whiteSpace: "nowrap",
    "&:hover": {
      opacity: 1,
      color: theme.palette.primary.light,
    },
  },
  username: {
    fontWeight: 600,
    color: theme.palette.text.primary,
    whiteSpace: "nowrap",
    marginRight: 6,
  },
  bodyWrapper: {
    cursor: "pointer",
  },
  body: {
    ...commentBodyStyles(theme),
    position: "relative",
    overflow: "hidden",
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
    "-webkit-line-clamp": 2,
  },
  toggleWrapper: {
    marginRight: 5,
    opacity: 0.8,
    fontSize: "0.8rem",
    lineHeight: "1rem",
    display: "flex",
    verticalAlign: "middle",
    "& span": {
      fontFamily: "monospace",
    },
  },
  toggleCharacter: {
    transform: 'translateY(0.75px)',
  },
  hoverOver: {
    width: 400,
  },
})

const LWQuickTakesCollapsedListItem = ({quickTake, setExpanded, classes}: {
  quickTake: ShortformComments,
  setExpanded: (expanded: boolean) => void,
  classes: ClassesType<typeof styles>,
}) => {
  const { CommentShortformIcon, ForumIcon, UsersName, CommentsMenu, LWPopper, CommentsNode, CommentsItemDate, SmallSideVote } = Components;

  const {eventHandlers, hover, anchorEl} = useHover({
    pageElementContext: "shortformItemTooltip",
    commentId: quickTake._id,
  });

  // const {onClick} = useClickableCell({onClick: () => setExpanded(true)});

  const expand = useCallback((e: React.MouseEvent) => {
    setExpanded(true);
  }, [setExpanded]);

  const commentCount = quickTake.descendentCount ?? 0;
  const commentsAreClickable = commentCount > 0;
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

  const shortformIcon = quickTake.post && <CommentShortformIcon comment={quickTake} post={quickTake.post} />;

  const collapseToggle = (
    <a className={classes.toggleWrapper} onClick={expand}>
      {<>[<span className={classes.toggleCharacter}>{"+"}</span>]</>}
    </a>
  );

  const username = <UsersName user={quickTake.user} className={classes.username} />;

  const commentDate = (
    <CommentsItemDate comment={quickTake} post={quickTake.post} />
  );

  const votingElement = !quickTake.rejected && (
    <SmallSideVote
      document={quickTake}
      collection={Comments}
      hideKarma={quickTake.post?.hideCommentKarma}
    />
  );

  const commentCountIcon = (
    <div
      onClick={onClickComments}
      className={classNames(classes.commentCount, {
        [classes.commentCountClickable]: commentsAreClickable,
      })}
    >
      <ForumIcon icon="Comment" />
      {commentCount}
    </div>
  );

  const commentMenu = (
    <div>
      <InteractionWrapper>
        <AnalyticsContext pageElementContext="tripleDotMenu">
          <CommentsMenu
            className={classes.menu}
            comment={quickTake}
            post={quickTake.post ?? undefined}
            tag={primaryTag}
            icon={<ForumIcon icon="EllipsisVertical" />}
            showEdit={setShowEdit} />
        </AnalyticsContext>
      </InteractionWrapper>
    </div>
  );

  const tooltip = (
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
          hoverPreview />
      </div>
    </LWPopper>
  );

  const body = (
    <div className={classes.bodyWrapper} onClick={expand}>
      <div {...eventHandlers}  className={classes.body}>
        {htmlToTextDefault(quickTake.contents?.html)}
      </div>
    </div>
  );

  return (
    <div
      // onClick={onClick}
      className={classes.root}
    >
      <div className={classes.info}>
        {shortformIcon}
        {collapseToggle}
        {username}
        {commentDate}
        {votingElement}
        <div className={classes.grow} />
        {commentCountIcon}
        {commentMenu}
      </div>
      {body}
      {tooltip}
    </div>
  );
}

const LWQuickTakesCollapsedListItemComponent = registerComponent(
  "LWQuickTakesCollapsedListItem",
  LWQuickTakesCollapsedListItem,
  {styles},
);

declare global {
  interface ComponentTypes {
    LWQuickTakesCollapsedListItem: typeof LWQuickTakesCollapsedListItemComponent
  }
}
