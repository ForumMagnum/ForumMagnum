import { registerComponent, Components, fragmentTextForQuery } from '../../lib/vulcan-lib';
import React, { useState } from 'react';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import Bookmark from '@material-ui/icons/Bookmark'
import BookmarkBorder from '@material-ui/icons/BookmarkBorder'
import { useCurrentUser } from '../common/withUser';
import { useDialog } from '../common/withDialog';
import withErrorBoundary from '../common/withErrorBoundary';
import type {TooltipProps} from '@material-ui/core/Tooltip';
import { useTracking } from '../../lib/analyticsEvents';
import { useMutation, gql } from '@apollo/client';
import * as _ from 'underscore';

const styles = (theme: ThemeType): JssStyles => ({
  icon: {
    cursor: "pointer",
    color: theme.palette.icon.dim3,
  }
})

const BookmarkButton = ({classes, post, menuItem, placement="right"}: {
  classes: ClassesType,
  post: PostsBase,
  menuItem?: boolean,
  placement?: TooltipProps["placement"],
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

  const { LWTooltip, MenuItem } = Components

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

  const icon = bookmarked ? <Bookmark/> : <BookmarkBorder/>
  const title = bookmarked ? "Un-bookmark" : "Bookmark"

  if (menuItem) {
    return (
      <MenuItem onClick={toggleBookmark}>
        <ListItemIcon>
          { icon }
        </ListItemIcon>
        {title}
      </MenuItem>
    )
  } else {
    return (
      <LWTooltip title={title} placement={placement}>
        <span onClick={toggleBookmark} className={classes.icon}>
        { icon }
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
