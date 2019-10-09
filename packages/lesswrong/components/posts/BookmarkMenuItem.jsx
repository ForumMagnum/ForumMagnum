import { registerComponent, useUpdate } from 'meteor/vulcan:core';
import React, { useState } from 'react';
import MenuItem from '@material-ui/core/MenuItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import Bookmark from '@material-ui/icons/Bookmark'
import BookmarkBorder from '@material-ui/icons/BookmarkBorder'
import withUser from '../common/withUser';
import Users from 'meteor/vulcan:users';

const BookmarkMenuItem = ({post, currentUser}) => {

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
  if (bookmarked) {
    return (
      <MenuItem onClick={handleUnBookmark}>
        <ListItemIcon>
          <BookmarkBorder/>
        </ListItemIcon>
        Un-bookmark
      </MenuItem>
    )
  } else {
    return (
      <MenuItem onClick={handleBookmark}>
        <ListItemIcon>
          <Bookmark />
        </ListItemIcon>
        Bookmark
      </MenuItem>
    )
  }

}

registerComponent('BookmarkMenuItem', BookmarkMenuItem, withUser);
