import { registerComponent, useUpdate } from 'meteor/vulcan:core';
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

const BookmarkButton = ({classes, post, currentUser, menuItem, placement="left"}) => {

  const [bookmarked, setBookmarked] = useState(currentUser?.bookmarkedPostIds?.includes(post._id))

  const {mutate: updateUser} = useUpdate({
    collection: Users,
    fragmentName: 'UsersCurrent',
  });
  
  const handleBookmark = () => {
    setBookmarked(true)
    const bookmarkIds = currentUser.bookmarkedPostIds || []
    updateUser({
      selector: {_id: currentUser._id},
      data: { bookmarkedPostIds: _.uniq([...bookmarkIds, post._id]) }
    });
  }

  const handleUnBookmark = () => {
    setBookmarked(false)
    const bookmarkIds = currentUser.bookmarkedPostIds || []
    updateUser({
      selector: {_id: currentUser._id},
      data: { bookmarkedPostIds: _.without(bookmarkIds, post._id) }
    });
  }

  if (bookmarked && menuItem) {
    return (
      <MenuItem onClick={handleUnBookmark}>
        <ListItemIcon>
          <Bookmark/>
        </ListItemIcon>
        Un-bookmark
      </MenuItem>
    )
  }
  if (!bookmarked && menuItem) {
    return (
      <MenuItem onClick={handleBookmark}>
        <ListItemIcon>
          <BookmarkBorder />
        </ListItemIcon>
        Bookmark
      </MenuItem>
    )
  }
  if (!menuItem) {
    return (
      <Tooltip title={bookmarked ? "Un-bookmark": "Bookmark this post"} placement={placement}>
        <span>
          {bookmarked ? <Bookmark className={classes.icon} onClick={handleUnBookmark}/> : <BookmarkBorder className={classes.icon} onClick={handleBookmark}/>}
        </span>
      </Tooltip>
    )
  }
}

registerComponent('BookmarkButton', BookmarkButton, withUser, withStyles(styles, {name:"BookmarkButton"}));
