import React from 'react';
import { TooltipSlot, type TooltipPlacement } from '../common/TooltipGroup';
import { USER_TOOLTIP_WIDTH } from '../users/LWUserTooltipContent';
import { getPostPreviewWidth } from './PostsPreviewTooltip/helpers';
import { defineStyles, useStyles } from '../hooks/useStyles';

const USER_CARD_OFFSET = 8;
const MIN_GAP_BETWEEN_CARDS = 6;

export const postsItemTooltipPlacements = {
  karma: { relativeTo: "group", placement: "bottom-start" },
  date: { slot: "date" },
  user: { slot: "user" },
  post: { slot: "post" },
} satisfies Record<string, TooltipPlacement>;

const styles = defineStyles("PostsItemTooltipTray", (theme: ThemeType) => {
  const postCardWidth = getPostPreviewWidth();
  const sideBySideMinWidth = USER_CARD_OFFSET + USER_TOOLTIP_WIDTH + MIN_GAP_BETWEEN_CARDS + postCardWidth;
  const cardsSideBySide = `@container (width >= ${sideBySideMinWidth}px)`;
  const cardsMerged = `@container (width < ${sideBySideMinWidth}px)`;
  const mergedCardWidth = Math.max(USER_TOOLTIP_WIDTH, postCardWidth);

  return {
    root: {
      display: "grid",
      gridTemplateAreas: '"user date" "user post"',
      gridTemplateColumns: "auto auto",
      // The user card spans both rows. Giving its extra height to the second
      // row keeps a tall user card from pushing the post card down.
      gridTemplateRows: "auto 1fr",
      justifyContent: "space-between",
      alignItems: "start",
      [cardsMerged]: {
        gridTemplateAreas: '"date" "cards"',
        gridTemplateColumns: `min(100%, ${mergedCardWidth}px)`,
        gridTemplateRows: "auto auto",
        justifyContent: "end",
      },
    },
    date: {
      gridArea: "date",
      justifySelf: "end",
    },
    cards: {
      display: "contents",
      [cardsMerged]: {
        display: "block",
        gridArea: "cards",
        background: theme.palette.panelBackground.default,
        boxShadow: theme.palette.boxShadow.lwCard,
        "& .LWUserTooltipContent-root, & .LWPostsPreviewTooltip-root": {
          width: "auto",
          boxShadow: "none",
        },
      },
    },
    user: {
      gridArea: "user",
      [cardsSideBySide]: {
        marginLeft: USER_CARD_OFFSET,
        "& .LWUserTooltipContent-root": {
          boxShadow: theme.palette.boxShadow.lwCard,
        },
      },
    },
    post: {
      gridArea: "post",
      [cardsMerged]: {
        "$user:not(:empty) + &:not(:empty)": {
          borderTop: theme.palette.border.faint,
        },
      },
    },
  };
});

/**
 * The layout of the tooltips that are positioned relative to a posts item as
 * a whole. The date tooltip goes in the bottom-end corner, above the post
 * card. The user card goes near the bottom-start corner if there is room for
 * it beside the post card, and otherwise is merged into the top of the post
 * card.
 */
const PostsItemTooltipTray = () => {
  const classes = useStyles(styles);

  return <div className={classes.root}>
    <TooltipSlot name={postsItemTooltipPlacements.date.slot} className={classes.date} />
    <div className={classes.cards}>
      <TooltipSlot name={postsItemTooltipPlacements.user.slot} className={classes.user} />
      <TooltipSlot name={postsItemTooltipPlacements.post.slot} className={classes.post} />
    </div>
  </div>;
};

export default PostsItemTooltipTray;
