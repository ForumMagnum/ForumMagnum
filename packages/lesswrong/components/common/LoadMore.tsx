import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import classNames from 'classnames';
import { queryIsUpdating } from './queryStatusUtils'
import {useTracking} from "../../lib/analyticsEvents";
import { LoadMoreCallback } from '../hooks/useQueryWithLoadMore';
import { useIsFirstRender } from "../hooks/useFirstRender";
import { isBookUI, isFriendlyUI, preferredHeadingCase } from '../../themes/forumTheme';
import { isAF } from '@/lib/instanceSettings';
import Loading from "../vulcan-core/Loading";
import type { WrappedFetchMore } from '../hooks/useQueryWithLoadMore';
import { defineStyles, useStyles } from '../hooks/useStyles';

const styles = defineStyles("LoadMore", (theme: ThemeType) => ({
  root: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    color: theme.palette.lwTertiary.main,
    ...(isBookUI && theme.dark && {
      color: theme.palette.text.bannerAdOverlay,
    }),
    display: "inline-block",
    minHeight: 20,
    ...(isFriendlyUI
      ? {
        fontSize: 14,
        fontWeight: 600,
        lineHeight: "24px",
      }
      : {}),
    ...(isAF && {
      fontWeight: 500,
    }),
  },
  afterPostsListMarginTop: {
    marginTop: 6,
  },
  loading: {
    minHeight: 20,
  },
  disabled: {
    color: theme.palette.grey[400],
    cursor: 'default',
    '&:hover': {
      opacity: 1
    }
  },
  sectionFooterStyles: {
    // This is an artifact of how SectionFooter is currently implemented, which should probably change.
    flexGrow: 1,
    textAlign: "left !important",
    marginLeft: "0 !important", // for loading spinner
    '&:after': {
      content: "'' !important",
      marginLeft: "0 !important",
      marginRight: "0 !important",
    }
  }
}), {stylePriority: -1})

/**
 * Load More button. The simplest way to use this is to take `loadMoreProps`
 * from the return value of `useMulti` and spread it into this component's
 * props.
 */
const LoadMore = ({
  loadMore,
  count,
  totalCount,
  className=null,
  loadingClassName,
  disabled=false,
  networkStatus,
  loading=false,
  hideLoading=false,
  hidden=false,
  sectionFooterStyles,
  afterPostsListMarginTop,
  message=preferredHeadingCase("Load More"),
}: {
  // loadMore: Callback when clicked.
  loadMore: WrappedFetchMore | LoadMoreCallback,
  // count/totalCount: If provided, looks like "Load More (10/25)"
  count?: number,
  totalCount?: number,
  // className: If provided, replaces the root style (default typography).
  className?: string|null|undefined,
  loadingClassName?: string,
  // disabled: If true, this is grayed out (eg because everything's already loaded).
  disabled?: boolean,
  networkStatus?: any,
  loading?: boolean,
  // hideLoading: Reserve space for the load spinner as normal, but don't show it
  hideLoading?: boolean,
  hidden?: boolean,
  sectionFooterStyles?: boolean,
  afterPostsListMarginTop?: boolean,
  message?: string,
}) => {
  const classes = useStyles(styles);
  const { captureEvent } = useTracking()

  // Don't show the loading animation on the initial render
  const isFirstRender = useIsFirstRender();
  loading = loading && !isFirstRender;
  const handleClickLoadMore = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    void loadMore();
    captureEvent("loadMoreClicked")
  }

  if (!hideLoading && (loading || (networkStatus && queryIsUpdating(networkStatus)))) {
    return <Loading className={classNames(classes.loading, loadingClassName, {[classes.sectionFooterStyles]: sectionFooterStyles})} />
  }

  if (hidden) return null;

  return (
    <a
      className={classNames(classes.root, className, {
        [classes.disabled]: disabled,
        [classes.sectionFooterStyles]: sectionFooterStyles,
        [classes.afterPostsListMarginTop]: afterPostsListMarginTop,
      })}
      href="#"
      onClick={handleClickLoadMore}
    >
      {totalCount ? `${message} (${count}/${totalCount})` : `${message}`}
    </a>
  )
}

export const LoadMorePlaceholder = ({sectionFooterStyles}: {
  sectionFooterStyles?: boolean,
}) => {
  const classes = useStyles(styles);
  return <a className={classNames(classes.root, sectionFooterStyles && classes.sectionFooterStyles)} href="#" >
    {preferredHeadingCase("Load More")}
  </a>
}

export default LoadMore;


