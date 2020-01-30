import React, { useState } from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import Menu from '@material-ui/core/Menu';
import Divider from '@material-ui/core/Divider';
import { useCurrentUser } from '../../common/withUser';
import Users from 'meteor/vulcan:users';
import MenuItem from '@material-ui/core/MenuItem';
import { useTracking } from "../../../lib/analyticsEvents";
import { subscriptionTypes } from '../../../lib/collections/subscriptions/schema'

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

const CommentsMenu = ({children, classes, className, comment, post, showEdit, icon}: {
  children?: any,
  classes: any,
  className?: string,
  comment: any,
  post: any,
  showEdit: any,
  icon?: any,
}) => {
  const [anchorEl, setAnchorEl] = useState<any>(null);
  const currentUser = useCurrentUser();
  const { captureEvent } = useTracking({eventType: "commentMenuClicked", eventProps: {commentId: comment._id, itemType: "comment"}})
  
  const { EditCommentMenuItem, ReportCommentMenuItem, DeleteCommentMenuItem, RetractCommentMenuItem, BanUserFromPostMenuItem, BanUserFromAllPostsMenuItem, MoveToAlignmentMenuItem, SuggestAlignmentMenuItem, BanUserFromAllPersonalPostsMenuItem, MoveToAnswersMenuItem, SubscribeTo, CommentsPermalinkMenuItem, ToggleIsModeratorComment } = Components
  
  if (!currentUser) return null
  
  return (
    <span className={className}>
      <span onClick={event => {
        captureEvent("commentMenuClicked", {open: true})
        setAnchorEl(event.currentTarget)
      }}>
        {icon ? icon : <MoreVertIcon
          className={classes.icon}/>}
      </span>
      <Menu
        onClick={event => {
          captureEvent("commentMenuClicked", {open: false})
          setAnchorEl(null)
        }}
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
      >
        <EditCommentMenuItem comment={comment} showEdit={showEdit}/>
        {comment.shortform && !comment.topLevelCommentId && (comment.user?._id && (comment.user._id !== currentUser._id)) &&
          <MenuItem>
            <SubscribeTo document={post} showIcon
              subscriptionType={subscriptionTypes.newShortform}
              subscribeMessage={`Subscribe to ${post.title}`}
              unsubscribeMessage={`Unsubscribe from ${post.title}`}
            />
          </MenuItem>
        }
        <MenuItem>
          <SubscribeTo document={comment} showIcon
            subscribeMessage="Subscribe to comment replies"
            unsubscribeMessage="Unsubscribe from comment replies"
          />
        </MenuItem>
        {comment.user?._id && (comment.user._id !== currentUser._id) &&
          <MenuItem>
            <SubscribeTo document={comment.user} showIcon
              subscribeMessage={"Subscribe to posts by "+Users.getDisplayName(comment.user)}
              unsubscribeMessage={"Unsubscribe from posts by "+Users.getDisplayName(comment.user)}
            />
          </MenuItem>
        }
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

const CommentsMenuComponent = registerComponent('CommentsMenu', CommentsMenu, {styles});

declare global {
  interface ComponentTypes {
    CommentsMenu: typeof CommentsMenuComponent,
  }
}

