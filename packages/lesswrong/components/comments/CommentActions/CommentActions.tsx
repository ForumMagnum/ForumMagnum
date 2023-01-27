import React from 'react';
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import Divider from '@material-ui/core/Divider';
import { userGetDisplayName, userCanModeratePost } from '../../../lib/collections/users/helpers';
import { useSingle } from '../../../lib/crud/withSingle';
import { subscriptionTypes } from '../../../lib/collections/subscriptions/schema'

const CommentActions = ({currentUser, comment, post, tag, showEdit, refetchAfterApproval}: {
  currentUser: UsersCurrent, // Must be logged in
  comment: CommentsList,
  post?: PostsMinimumInfo,
  tag?: TagBasicInfo,
  showEdit: () => void,
  refetchAfterApproval?: () => Promise<void>
}) => {
  const { EditCommentMenuItem, ReportCommentMenuItem, DeleteCommentMenuItem, RetractCommentMenuItem, 
          BanUserFromPostMenuItem, BanUserFromAllPostsMenuItem, MoveToAlignmentMenuItem, SuggestAlignmentMenuItem,
          BanUserFromAllPersonalPostsMenuItem, MoveToAnswersMenuItem, NotifyMeButton, ToggleIsModeratorComment,
          PinToProfileMenuItem, CommentApprovalMenuItem } = Components
  
  const { document: postDetails } = useSingle({
    skip: !post,
    documentId: post?._id,
    collectionName: "Posts",
    fetchPolicy: "cache-first",
    fragmentName: "PostsDetails",
  });
  
  // WARNING: Clickable items in this menu must be full-width, and
  // ideally should use the <MenuItem> component. In particular,
  // do NOT wrap a <MenuItem> around something that has its own
  // onClick handler; the onClick handler should either be on the
  // MenuItem, or on something outside of it. Putting an onClick
  // on an element inside of a MenuItem can create a dead-space
  // click area to the right of the item which looks like you've
  // selected the thing, and closes the menu, but doesn't do the
  // thing.
  
  return <>
    <EditCommentMenuItem comment={comment} showEdit={showEdit}/>
    {post && (currentUser._id === comment.userId || currentUser.isAdmin) && <PinToProfileMenuItem comment={comment}/>}
    {post && comment.shortform && !comment.topLevelCommentId && (comment.user?._id && (comment.user._id !== currentUser._id)) && 
      <NotifyMeButton asMenuItem document={post} showIcon
        subscriptionType={subscriptionTypes.newShortform}
        subscribeMessage={`Subscribe to ${post.title}`}
        unsubscribeMessage={`Unsubscribe from ${post.title}`}
      />
    }
    <NotifyMeButton asMenuItem document={comment} showIcon
      subscribeMessage="Subscribe to comment replies"
      unsubscribeMessage="Unsubscribe from comment replies"
    />
    {comment.user?._id && (comment.user._id !== currentUser._id) &&
      <NotifyMeButton asMenuItem document={comment.user} showIcon
        subscribeMessage={"Subscribe to posts by "+userGetDisplayName(comment.user)}
        unsubscribeMessage={"Unsubscribe from posts by "+userGetDisplayName(comment.user)}
      />
    }
    {post && <ReportCommentMenuItem comment={comment}/>}
    {postDetails && <MoveToAlignmentMenuItem comment={comment} post={postDetails}/>}
    {postDetails && <SuggestAlignmentMenuItem comment={comment} post={postDetails}/>}
    {postDetails && userCanModeratePost(currentUser, postDetails) && postDetails.user && <Divider />}
    {postDetails && <MoveToAnswersMenuItem comment={comment} post={postDetails}/>}
    {(postDetails||tag) && <DeleteCommentMenuItem comment={comment} post={postDetails} tag={tag}/>}
    <RetractCommentMenuItem comment={comment}/>
    {postDetails && <BanUserFromPostMenuItem comment={comment} post={postDetails}/>}
    {postDetails && <BanUserFromAllPostsMenuItem comment={comment} post={postDetails}/>}
    {postDetails && <BanUserFromAllPersonalPostsMenuItem comment={comment} post={postDetails}/>}
    <ToggleIsModeratorComment comment={comment}/>
    <CommentApprovalMenuItem comment={comment} currentUser={currentUser} refetchAfterApproval={refetchAfterApproval} />
  </>
}

const CommentActionsComponent = registerComponent("CommentActions", CommentActions);

declare global {
  interface ComponentTypes {
    CommentActions: typeof CommentActionsComponent,
  }
}
