import React, { useCallback, useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { useHover } from "../common/withHover";
import { isMobile } from "../../lib/utils/isMobile";
import { postGetPageUrl } from "../../lib/collections/posts/helpers";
import classNames from "classnames";
import { commentBodyStyles } from "../../themes/stylePiping";

const styles = (theme: ThemeType) => ({
  root: {
    color: theme.palette.greyAlpha(0.5),
    background: theme.palette.grey[0],
    borderRadius: theme.borderRadius.small,
    border: `1px solid ${theme.palette.grey[200]}`,
    paddingLeft: 12,
    paddingRight: 12,
    paddingBottom: 10,
    "&:hover .CommentsItemMeta-menu": {
      opacity: 1
    },
    ...theme.typography.commentStyle,
  },
  commentCount: {
    color: theme.palette.grey[600],
    display: "flex",
    alignItems: "center",
    "& svg": {
      height: 14,
    },
    paddingBottom: 4,
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
  },
  commentCountClickable: {
    cursor: "pointer",
    "&:hover": {
      color: theme.palette.grey[1000],
    },
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
  hoverOver: {
    width: 400,
  },
  commentCountText: {
    marginTop: -4,
  },
});

const LWQuickTakesCollapsedListItem = ({ quickTake, setExpanded, classes }: {
  quickTake: ShortformComments,
  setExpanded: (expanded: boolean) => void,
  classes: ClassesType<typeof styles>,
}) => {
  const { ForumIcon, LWPopper, CommentsNode, CommentsItemMeta, CommentBottomCaveats } = Components;

  const {eventHandlers, hover, anchorEl} = useHover({
    eventProps: {
      pageElementContext: "shortformItemTooltip",
      commentId: quickTake._id,
    },
  });

  const expand = useCallback(() => {
    setExpanded(true);
  }, [setExpanded]);

  const [showParentState, setShowParentState] = useState(false);

  const toggleShowParent = () => {
    setShowParentState(!showParentState);
  }

  const commentCount = quickTake.descendentCount ?? 0;
  const commentsAreClickable = commentCount > 0;
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
      expand();
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
  }, [expand, commentsAreClickable, quickTake]);

  const commentCountIcon = (
    <div
      onClick={onClickComments}
      className={classNames(classes.commentCount, {
        [classes.commentCountClickable]: commentsAreClickable,
      })}
    >
      <ForumIcon icon="Comment" />
      <span className={classes.commentCountText}>
        {commentCount}
      </span>
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
    <div className={classes.bodyWrapper} onClick={expand} {...eventHandlers}>
      <div  className={classes.body}>
        {quickTake.contents?.plaintextMainText}
      </div>
    </div>
  );

  return (
    <div
      className={classes.root}
    >
      <CommentsItemMeta
        {...{
          treeOptions: {
            post: quickTake.post ?? undefined,
            hideParentCommentToggle: true,
            showCollapseButtons: false,
            onToggleCollapsed: () => setExpanded(true),
          },
          comment: quickTake,
          showCommentTitle: false,
          showParentState,
          toggleShowParent,
          collapsed: false,
          toggleCollapse: () => setExpanded(true),
          setShowEdit,
          rightSectionElements: commentCountIcon
        }}
      />
      {body}
      <CommentBottomCaveats comment={quickTake} />
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
