import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useUpdate } from '../../lib/crud/withUpdate';
import React, { useState } from 'react';
import MenuItem from '@material-ui/core/MenuItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import Bookmark from '@material-ui/icons/Bookmark'
import BookmarkBorder from '@material-ui/icons/BookmarkBorder'
import { useCurrentUser } from '../common/withUser';
import { useDialog } from '../common/withDialog';
import withErrorBoundary from '../common/withErrorBoundary';
import Users from '../../lib/collections/users/collection';
import {TooltipProps} from '@material-ui/core/Tooltip';
import { useTracking } from '../../lib/analyticsEvents';
import * as _ from 'underscore';
import classNames from 'classnames';

const styles = theme => ({
  icon: {
    cursor: "pointer",
    color: "rgba(0, 0, 0, 0.54)"
  },
  lightIcon: {
    color: theme.palette.grey[400] // some places require the icon color to be lighter to avoid being too ostentatious
  }
})

const BookmarkButton = ({classes, post, menuItem, placement="right", lightIcon=true}: {
  classes: ClassesType,
  post: PostsBase,
  menuItem?: boolean,
  lightIcon?: boolean,
  placement?: TooltipProps["placement"],
}) => {
  const currentUser = useCurrentUser();
  const { openDialog } = useDialog();
  const [bookmarked, setBookmarked] = useState(_.pluck((currentUser?.bookmarkedPostsMetadata || []), 'postId')?.includes(post._id))
  const { captureEvent } = useTracking({eventType: "bookmarkToggle", eventProps: {"postId": post._id, "bookmarked": !bookmarked}})

  const {mutate: updateUser} = useUpdate({
    collection: Users,
    fragmentName: 'UserBookmarks',
  });

  const { LWTooltip } = Components


  const toggleBookmark = (event) => {
    if (!currentUser) {
      openDialog({
        componentName: "LoginPopup",
        componentProps: {}
      });
      event.preventDefault();
      return
    }

    if (bookmarked) {
      setBookmarked(false)
      const bookmarks = currentUser.bookmarkedPostsMetadata || []
      const newBookmarks = _.without(bookmarks, _.findWhere(bookmarks, {postId: post._id}))

      updateUser({
        selector: {_id: currentUser._id},
        data: { bookmarkedPostsMetadata: newBookmarks }
      });
    } else {
      setBookmarked(true)
      const bookmarks = currentUser.bookmarkedPostsMetadata || []
      updateUser({
        selector: {_id: currentUser._id},
        data: { bookmarkedPostsMetadata: [...bookmarks, {postId: post._id}] }
      });
    }
    captureEvent()
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
        <a onClick={toggleBookmark} className={classNames(classes.icon, {[classes.lightIcon]:lightIcon})}>
          { icon }
        </a>
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
