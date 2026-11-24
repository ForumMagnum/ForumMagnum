import React from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '../hooks/useStyles';
import ForumIcon from '../common/ForumIcon';
import { AnalyticsContext, useTracking } from '@/lib/analyticsEvents';
import LWTooltip from '../common/LWTooltip';
import Headroom from '@/lib/react-headroom';
import PostActionsButton from '../dropdowns/posts/PostActionsButton';
import { usePostsPageContext } from './PostsPage/PostsPageContext';
import CommentIcon from '@/lib/vendor/@material-ui/icons/src/ModeComment';
import isNumber from 'lodash/isNumber';
import { NARRATION_PLAYER_DOCKED_CLASS } from '../narration/narrationPlayerLayout';

/**
 * A custom property that's 1 on the body while the bottom bar is on screen,
 * and otherwise unset. Something that sits on top of the bottom bar uses it to
 * move up and down as the bar slides in and out. (The bar's height is
 * `--header-height`.)
 */
export const POSTS_BOTTOM_BAR_SHOWN_PROPERTY = "--posts-bottom-bar-shown";

const styles = defineStyles("PostsBottomBar", (theme: ThemeType) => ({
  headroom: {
    [theme.breakpoints.down('xs')]: {
      "body:has(& .headroom--pinned)": {
        [POSTS_BOTTOM_BAR_SHOWN_PROPERTY]: "1",
      },
    },
    // Styles for bottom bar scrolling, provided by react-headroom
    // Adapted from Header implementation for bottom positioning
    "& .headroom": {
      bottom: 0,
      top: "auto",
      left: 0,
      right: 0,
      zIndex: theme.zIndexes.ultrafeedBottomBar,
    },
    "& .headroom--unfixed": {
      position: "relative",
      transform: "translateY(0)",
    },
    "& .headroom--scrolled": {
      transition: "transform 200ms ease-in-out",
    },
    "& .headroom--unpinned": {
      position: "fixed",
      transform: "translateY(100%)", // Move down to hide (opposite of header)
    },
    "& .headroom--pinned": {
      position: "fixed",
      transform: "translateY(0%)",
    },
    // Move bottom bar up when Type III sticky player is visible
    "body.t3a-sticky-player-visible & .headroom": {
      bottom: "var(--header-height)",
    },
  },
  root: {
    height: "var(--header-height)",
    opacity: 0.95,
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    boxShadow: `0 -2px 8px ${theme.palette.greyAlpha(0.1)}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    [theme.breakpoints.up('sm')]: {
      display: 'none',
    },
    '@media print': {
      display: 'none',
    },
    // The narration player sits on top of the bar, as part of the same panel.
    // The bar's shadow would draw a line between them, and the player isn't
    // see-through, because it has text in it.
    [`body.${NARRATION_PLAYER_DOCKED_CLASS} &`]: {
      boxShadow: 'none',
      opacity: 1,
    },
  },
  button: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px 10px',
    cursor: 'pointer',
    borderRadius: 4,
    transition: 'background-color 0.2s ease-in-out',
    '&:hover': {
      backgroundColor: theme.palette.grey[200],
    },
  },
  icon: {
    width: 28,
    height: 28,
    color: theme.palette.grey[400],
  },
  backArrow: {
    transform: 'rotate(180deg)',
  },
  upArrow: {
    transform: 'rotate(-90deg)',
  },
  commentsButton: {
    position: 'relative',
    top: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentIcon: {
    width: 34,
    height: 34,
    color: theme.palette.grey[400],
  },
  commentCount: {
    position: 'absolute',
    right: '50%',
    top: '40%',
    transform: 'translate(50%, -50%)',
    color: theme.palette.text.alwaysWhite,
    fontVariantNumeric: 'lining-nums',
    ...theme.typography.commentStyle,
    fontSize: 16,
  },
  actionsButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsIcon: {
    fontSize: 36,
    color: theme.palette.grey[400],
  },
}));

const PostsBottomBar = () => {
  const classes = useStyles(styles);
  const { captureEvent } = useTracking();
  const postsPageContext = usePostsPageContext();
  const post = postsPageContext?.fullPost ?? postsPageContext?.postPreload ?? null;
  
  const handleBackClick = () => {
    captureEvent('postsBottomBarClicked', { button: 'back' });
    window.history.back();
  };

  const handleScrollToTop = () => {
    captureEvent('postsBottomBarClicked', { button: 'scrollToTop' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCommentsClick = () => {
    captureEvent('postsBottomBarClicked', { button: 'comments' });
    const commentsElement = document.getElementById('comments');
    if (commentsElement) {
      commentsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <AnalyticsContext pageElementContext="postsBottomBar">
      <Headroom
        disableInlineStyles
        downTolerance={1}
        upTolerance={1}
        height={56}
        className={classes.headroom}
        pinStart={-999999} // In contrast to the header where we want to switch postion from fixed to relative, doing this for the bottom bar would make it disappear since it is no longer fixed to the viewport. -999999 prevents this.
      >
        <div className={classes.root}>
          <LWTooltip title="Back" placement="top" disabledOnMobile>
            <div className={classes.button} onClick={handleBackClick}>
              <ForumIcon icon="ArrowForward" className={classNames(classes.icon, classes.backArrow)} />
            </div>
          </LWTooltip>

          <LWTooltip title="Scroll to top" placement="top" disabledOnMobile>
            <div className={classes.button} onClick={handleScrollToTop}>
              <ForumIcon icon="ArrowForward" className={classNames(classes.icon, classes.upArrow)} />
            </div>
          </LWTooltip>

          <LWTooltip title="Comments" placement="top" disabledOnMobile>
            <div className={classes.button} onClick={handleCommentsClick}>
              <div className={classes.commentsButton}>
                <CommentIcon className={classes.commentIcon} />
                {isNumber(post?.commentCount) && (
                  <div className={classes.commentCount}>
                    {post.commentCount}
                  </div>
                )}
              </div>
            </div>
          </LWTooltip>

          {post && (
            <div className={classes.actionsButton}>
              <PostActionsButton post={post} flip={true} autoPlace={true} iconClassName={classes.actionsIcon} />
            </div>
          )}
        </div>
      </Headroom>
    </AnalyticsContext>
  );
};

export default PostsBottomBar;

