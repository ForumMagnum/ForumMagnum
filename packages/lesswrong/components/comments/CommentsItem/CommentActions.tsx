import React from 'react';
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import Divider from '@material-ui/core/Divider';
import Users from '../../../lib/collections/users/collection';
import MenuItem from '@material-ui/core/MenuItem';
import { subscriptionTypes } from '../../../lib/collections/subscriptions/schema'

const CommentActions = ({currentUser, comment, post, showEdit}: {
  currentUser: UsersCurrent, // Must be logged in
  comment: CommentsList,
  post: PostsDetails,
  showEdit: ()=>void,
}) => {
  const { EditCommentMenuItem, ReportCommentMenuItem, DeleteCommentMenuItem, RetractCommentMenuItem, BanUserFromPostMenuItem, BanUserFromAllPostsMenuItem, MoveToAlignmentMenuItem, SuggestAlignmentMenuItem, BanUserFromAllPersonalPostsMenuItem, MoveToAnswersMenuItem, SubscribeTo, ToggleIsModeratorComment } = Components
  
  return <>
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
  </>
}

const CommentActionsComponent = registerComponent("CommentActions", CommentActions);

declare global {
  interface ComponentTypes {
    CommentActions: typeof CommentActionsComponent,
  }
}

