import React from 'react'
import { withStyles } from '@material-ui/core/styles';
import { registerComponent, Components } from 'meteor/vulcan:core';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import withState from 'recompose/withState';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { Posts } from '../../../lib/collections/posts';
import withUser from '../../common/withUser'

const styles = theme => ({
  icon: {
    verticalAlign: 'bottom'
  },
})

const PostsPageMobileActions = ({classes, post, setMenuAnchor, anchorEl, currentUser}) =>
  <div>
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



registerComponent('PostsPageMobileActions', PostsPageMobileActions,
  withStyles(styles, {name: "PostsPageMobileActions"}),
  withState('anchorEl', 'setMenuAnchor', null),
  withUser
)
