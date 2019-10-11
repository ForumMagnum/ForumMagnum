import { Components, registerComponent, useUpdate } from 'meteor/vulcan:core';
import React, { useState } from 'react';
import MenuItem from '@material-ui/core/MenuItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import Bookmark from '@material-ui/icons/Bookmark'
import BookmarkBorder from '@material-ui/icons/BookmarkBorder'
import withUser from '../common/withUser';
import Users from 'meteor/vulcan:users';
import Tooltip from '@material-ui/core/Tooltip';
import { withStyles } from '@material-ui/core/styles'

const styles = theme => ({
  icon: {
    cursor: "pointer"
  }
})

const BookmarkButton = ({classes, post, currentUser, menuItem, placement="right"}) => {

  const [bookmarked, setBookmarked] = useState(currentUser?.bookmarkedPostIds?.includes(post._id))
  const { LoginPopupButton } = Components

  const {mutate: updateUser} = useUpdate({
    collection: Users,
    fragmentName: 'UserBookmarks',
  });

  const toggleBookmark = () => {
    if (bookmarked) {
      setBookmarked(false)
      const bookmarkIds = currentUser.bookmarkedPostIds || []
      updateUser({
        selector: {_id: currentUser._id},
        data: { bookmarkedPostIds: _.without(bookmarkIds, post._id) }
      });
    } else {
      setBookmarked(true)
      const bookmarkIds = currentUser.bookmarkedPostIds || []
      updateUser({
        selector: {_id: currentUser._id},
        data: { bookmarkedPostIds: _.uniq([...bookmarkIds, post._id]) }
      });
    }
  }

  const icon = bookmarked ? <Bookmark/> : <BookmarkBorder/>
  const title = bookmarked ? "Un-bookmark" : "Bookmark"

  if (menuItem) {
    return (
      <LoginPopupButton>
        <MenuItem onClick={toggleBookmark}>
          <ListItemIcon>
            { icon }
          </ListItemIcon>
          {title}
        </MenuItem>
      </LoginPopupButton>
    )
  } else {
    return (
      <Tooltip title={title} placement={placement}>
        <LoginPopupButton>
          <span onClick={toggleBookmark} className={classes.icon}>
          { icon }
          </span>
        </LoginPopupButton>
      </Tooltip>
    )
  }
}

registerComponent('BookmarkButton', BookmarkButton, withUser, withStyles(styles, {name:"BookmarkButton"}));
