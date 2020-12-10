import React from 'react';
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import Divider from '@material-ui/core/Divider';
import { userGetDisplayName, userCanModeratePost } from '../../../lib/collections/users/helpers';
import MenuItem from '@material-ui/core/MenuItem';
import { useSingle } from '../../../lib/crud/withSingle';
import { subscriptionTypes } from '../../../lib/collections/subscriptions/schema'

const CommentActions = ({currentUser, comment, post, showEdit}: {
  currentUser: UsersCurrent, // Must be logged in
  comment: CommentsList,
  post?: PostsMinimumInfo,
  showEdit: ()=>void,
}) => {
  const { EditCommentMenuItem, ReportCommentMenuItem, DeleteCommentMenuItem, RetractCommentMenuItem, BanUserFromPostMenuItem, BanUserFromAllPostsMenuItem, MoveToAlignmentMenuItem, SuggestAlignmentMenuItem, BanUserFromAllPersonalPostsMenuItem, MoveToAnswersMenuItem, SubscribeTo, ToggleIsModeratorComment, Loading } = Components
  
  const { document: postDetails, loading } = useSingle({
    skip: !post,
    documentId: post?._id,
    collectionName: "Posts",
    fetchPolicy: "cache-first",
    fragmentName: "PostsDetails",
  });
  
  if (loading)
    return <Loading/>
  
  return <>
    <EditCommentMenuItem comment={comment} showEdit={showEdit}/>
    {post && comment.shortform && !comment.topLevelCommentId && (comment.user?._id && (comment.user._id !== currentUser._id)) &&
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
          subscribeMessage={"Subscribe to posts by "+userGetDisplayName(comment.user)}
          unsubscribeMessage={"Unsubscribe from posts by "+userGetDisplayName(comment.user)}
        />
      </MenuItem>
    }
    {post && <ReportCommentMenuItem comment={comment}/>}
    {post && <MoveToAlignmentMenuItem comment={comment} post={postDetails}/>}
    {post && <SuggestAlignmentMenuItem comment={comment} post={postDetails}/>}
    { userCanModeratePost(currentUser, postDetails) && postDetails?.user && <Divider />}
    {post && <MoveToAnswersMenuItem comment={comment} post={postDetails}/>}
    {post && <DeleteCommentMenuItem comment={comment} post={postDetails}/>}
    <RetractCommentMenuItem comment={comment}/>
    {post && <BanUserFromPostMenuItem comment={comment} post={postDetails}/>}
    {post && <BanUserFromAllPostsMenuItem comment={comment} post={postDetails}/>}
    {post && <BanUserFromAllPersonalPostsMenuItem comment={comment} post={postDetails}/>}
    <ToggleIsModeratorComment comment={comment}/>
  </>
}

const CommentActionsComponent = registerComponent("CommentActions", CommentActions);

declare global {
  interface ComponentTypes {
    CommentActions: typeof CommentActionsComponent,
  }
}

