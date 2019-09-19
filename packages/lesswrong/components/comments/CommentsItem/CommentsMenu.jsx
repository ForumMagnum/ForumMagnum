import React, { useState } from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import Menu from '@material-ui/core/Menu';
import Divider from '@material-ui/core/Divider';
import { useCurrentUser } from '../../common/withUser';
import Users from 'meteor/vulcan:users';
import MenuItem from '@material-ui/core/MenuItem';

import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  icon: {
    cursor: "pointer",
    fontSize:"1.4rem"
  },
  menu: {
    position:"absolute",
    right:0,
    top:0,
    zIndex: theme.zIndexes.commentsMenu,
  }
})

const CommentsMenu = ({children, classes, className, comment, post, showEdit, icon}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const currentUser = useCurrentUser();
  
  const { EditCommentMenuItem, ReportCommentMenuItem, DeleteCommentMenuItem, RetractCommentMenuItem, BanUserFromPostMenuItem, BanUserFromAllPostsMenuItem, MoveToAlignmentMenuItem, SuggestAlignmentMenuItem, BanUserFromAllPersonalPostsMenuItem, MoveToAnswersMenuItem, SubscribeTo, CommentsPermalinkMenuItem, ToggleIsModeratorComment } = Components
  
  if (!currentUser) return null
  
  return (
    <span className={className}>
      <span onClick={event => setAnchorEl(event.currentTarget)}>
        {icon ? icon : <MoreVertIcon
          className={classes.icon}/>}
      </span>
      <Menu
        onClick={event => setAnchorEl(null)}
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
      >
        {comment.user._id !== currentUser._id &&
          <MenuItem>
            <SubscribeTo document={comment}
              subscribeMessage="Subscribe to Comment Replies"
              unsubscribeMessage="Unsubscribe from Comment Replies"
            />
          </MenuItem>
        }
        {comment.user._id !== currentUser._id &&
          <MenuItem>
            <SubscribeTo document={comment.user}
              subscribeMessage={"Subscribe to "+Users.getDisplayName(comment.user)}
              unsubscribeMessage={"Unsubscribe from "+Users.getDisplayName(comment.user)}
            />
          </MenuItem>
        }
        <EditCommentMenuItem comment={comment} showEdit={showEdit}/>
        <ReportCommentMenuItem comment={comment}/>
        <CommentsPermalinkMenuItem comment={comment} post={post} />
        <MoveToAlignmentMenuItem comment={comment} post={post}/>
        <SuggestAlignmentMenuItem comment={comment} post={post}/>
        { Users.canModeratePost(currentUser, post) && post.user && Users.canModeratePost(post.user, post) && <Divider />}
        <MoveToAnswersMenuItem comment={comment} post={post}/>
        <DeleteCommentMenuItem comment={comment} post={post}/>
        <RetractCommentMenuItem comment={comment}/>
        <BanUserFromPostMenuItem comment={comment} post={post}/>
        <BanUserFromAllPostsMenuItem comment={comment} post={post}/>
        <BanUserFromAllPersonalPostsMenuItem comment={comment} post={post}/>
        <ToggleIsModeratorComment comment={comment}/>
        {children}
      </Menu>
    </span>
  )
}

registerComponent('CommentsMenu', CommentsMenu, withStyles(styles, {name:"CommentsMenu"}))
