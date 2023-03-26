import { registerComponent, Components, fragmentTextForQuery } from '../../lib/vulcan-lib';
import React, { useState } from 'react';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import { useCurrentUser } from '../common/withUser';
import { useDialog } from '../common/withDialog';
import withErrorBoundary from '../common/withErrorBoundary';
import type {TooltipProps} from '@material-ui/core/Tooltip';
import { useTracking } from '../../lib/analyticsEvents';
import { useMutation, gql } from '@apollo/client';
import * as _ from 'underscore';
import { isEAForum } from '../../lib/instanceSettings';
import classNames from 'classnames';

const styles = (theme: ThemeType): JssStyles => ({
  container: {
    cursor: "pointer",
    color: theme.palette.icon.dim3,
  },
  icon: isEAForum ? {fontSize: 22} : {},
})

const BookmarkButton = ({classes, post, menuItem, placement="right", className}: {
  classes: ClassesType,
  post: PostsBase,
  menuItem?: boolean,
  placement?: TooltipProps["placement"],
  className?: string,
}) => {
  const currentUser = useCurrentUser();
  const { openDialog } = useDialog();
  const [bookmarked, setBookmarkedState] = useState(_.pluck((currentUser?.bookmarkedPostsMetadata || []), 'postId')?.includes(post._id))
  const { captureEvent } = useTracking()

  const [setIsBookmarkedMutation] = useMutation(gql`
    mutation setIsBookmarked($postId: String!, $isBookmarked: Boolean!) {
      setIsBookmarked(postId: $postId, isBookmarked: $isBookmarked) {
        ...UsersCurrent
      }
    }
    ${fragmentTextForQuery("UsersCurrent")}
  `);
  const setBookmarked = (isBookmarked: boolean) => {
    setBookmarkedState(isBookmarked)
    void setIsBookmarkedMutation({
      variables: {postId: post._id, isBookmarked}
    });
  };

  const { LWTooltip, MenuItem, ForumIcon } = Components;

  const toggleBookmark = (event: React.MouseEvent) => {
    if (!currentUser) {
      openDialog({
        componentName: "LoginPopup",
        componentProps: {}
      });
      event.preventDefault();
      return
    }

    setBookmarked(!bookmarked);
    captureEvent("bookmarkToggle", {"postId": post._id, "bookmarked": !bookmarked})
  }

  const icon = bookmarked ? "Bookmark" : "BookmarkBorder";
  const title = bookmarked ? "Un-bookmark" : "Bookmark";

  if (menuItem) {
    return (
      <MenuItem onClick={toggleBookmark}>
        <ListItemIcon>
          <ForumIcon icon={icon} className={classNames(classes.icon, className)} />
        </ListItemIcon>
        {title}
      </MenuItem>
    )
  } else {
    return (
      <LWTooltip title={title} placement={placement}>
        <span onClick={toggleBookmark} className={classes.container}>
          <ForumIcon icon={icon} className={classNames(classes.icon, className)} />
        </span>
      </LWTooltip>
    )
  }
}

const BookmarkButtonComponent = registerComponent('BookmarkButton', BookmarkButton, {
  styles,
  hocs: [withErrorBoundary],
});

declare global {
  interface ComponentTypes {
    BookmarkButton: typeof BookmarkButtonComponent
  }
}
