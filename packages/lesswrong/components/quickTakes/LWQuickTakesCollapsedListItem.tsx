import React, { useCallback, useState } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { useHover } from "../common/withHover";
import { isMobile } from "../../lib/utils/isMobile";
import { postGetPageUrl } from "../../lib/collections/posts/helpers";
import classNames from "classnames";
import { commentBodyStyles } from "../../themes/stylePiping";
import ForumIcon from "../common/ForumIcon";
import LWPopper from "../common/LWPopper";
import CommentsNode from "../comments/CommentsNode";
import CommentsItemMeta from "../comments/CommentsItem/CommentsItemMeta";
import CommentBottomCaveats from "../comments/CommentsItem/CommentBottomCaveats";

const styles = (theme: ThemeType) => ({
  root: {
    color: theme.palette.text.bannerAdOverlay,
    background: theme.palette.panelBackground.bannerAdTranslucentMedium,
    backdropFilter: theme.palette.filters.bannerAdBlurHeavy,
    borderRadius: theme.borderRadius.small,
    border: "none",
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
    color: theme.palette.text.bannerAdOverlay,
    position: "relative",
    overflow: "hidden",
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
    "-webkit-line-clamp": 2,
  },
  hoverOver: {
    width: 400,
    background: theme.palette.panelBackground.bannerAdTranslucentDeep,
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

export default registerComponent(
  "LWQuickTakesCollapsedListItem",
  LWQuickTakesCollapsedListItem,
  {styles},
);


