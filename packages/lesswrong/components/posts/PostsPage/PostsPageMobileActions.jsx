import React from 'react'
import { withStyles } from '@material-ui/core/styles';
import { registerComponent, Components } from 'meteor/vulcan:core';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import withState from 'recompose/withState';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { Posts } from '../../../lib/collections/posts';
import Users from 'meteor/vulcan:users'
import withUser from '../../common/withUser'

const styles = theme => ({
  icon: {
    verticalAlign: 'bottom'
  },
})

const showPostActions = (currentUser, post) => {
  return Users.canDo(currentUser, "posts.edit.all") ||
    Users.canMakeAlignmentPost(currentUser, post) ||
    Users.canSuggestPostForAlignment({currentUser, post}) ||
    Posts.canEdit(currentUser, post)
}

const PostsPageMobileActions = ({classes, post, setMenuAnchor, anchorEl, currentUser}) => {
  if (showPostActions(currentUser, post)) {
    return <div>
      <MoreHorizIcon className={classes.icon} onClick={e => setMenuAnchor(e.target)}/>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setMenuAnchor(null)}
      >
        { Posts.canEdit(currentUser,post) && <MenuItem>
          <Components.PostsEdit post={post}/>
        </MenuItem> }
        <Components.PostActions Container={MenuItem} post={post}/>
      </Menu>
    </div>
  } else {
    return null
  }
}


registerComponent('PostsPageMobileActions', PostsPageMobileActions,
  withStyles(styles, {name: "PostsPageMobileActions"}),
  withState('anchorEl', 'setMenuAnchor', null),
  withUser
)
