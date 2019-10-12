import { registerComponent, useUpdate } from 'meteor/vulcan:core';
import React, { useState } from 'react';
import MenuItem from '@material-ui/core/MenuItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import Bookmark from '@material-ui/icons/Bookmark'
import BookmarkBorder from '@material-ui/icons/BookmarkBorder'
import withUser from '../common/withUser';
import withDialog from '../common/withDialog';
import withErrorBoundary from '../common/withErrorBoundary';
import Users from 'meteor/vulcan:users';
import Tooltip from '@material-ui/core/Tooltip';
import { withStyles } from '@material-ui/core/styles'

const styles = theme => ({
  icon: {
    cursor: "pointer",
    color: theme.palette.grey[500]
  }
})

const BookmarkButton = ({classes, post, currentUser, menuItem, placement="right", openDialog}) => {

  const [bookmarked, setBookmarked] = useState(_.pluck((currentUser?.bookmarkedPostsMetadata || []), 'postId')?.includes(post._id))

  const {mutate: updateUser} = useUpdate({
    collection: Users,
    fragmentName: 'UserBookmarks',
  });

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
        data: { bookmarkedPostsMetadata: newBookmarks
      }
      });
    } else {
      setBookmarked(true)
      const bookmarks = currentUser.bookmarkedPostsMetadata || []
      const newBookmarks = _.uniq([...bookmarks, {postId: post._id}])
      updateUser({
        selector: {_id: currentUser._id},
        data: { bookmarkedPostsMetadata: newBookmarks }
      });
    }
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
      <Tooltip title={title} placement={placement}>
        <span onClick={toggleBookmark} className={classes.icon}>
        { icon }
        </span>
      </Tooltip>
    )
  }
}

registerComponent('BookmarkButton', BookmarkButton, withUser, withErrorBoundary, withStyles(styles, {name:"BookmarkButton"}), withDialog);
