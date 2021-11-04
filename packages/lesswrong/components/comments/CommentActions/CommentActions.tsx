import React from 'react';
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import Divider from '@material-ui/core/Divider';
import { userGetDisplayName, userCanModeratePost } from '../../../lib/collections/users/helpers';
import MenuItem from '@material-ui/core/MenuItem';
import { useSingle } from '../../../lib/crud/withSingle';
import { subscriptionTypes } from '../../../lib/collections/subscriptions/schema'

const CommentActions = ({currentUser, comment, post, tag, showEdit}: {
  currentUser: UsersCurrent, // Must be logged in
  comment: CommentsList,
  post?: PostsMinimumInfo,
  tag?: TagBasicInfo,
  showEdit: ()=>void,
}) => {
  const { EditCommentMenuItem, ReportCommentMenuItem, DeleteCommentMenuItem, RetractCommentMenuItem, BanUserFromPostMenuItem, BanUserFromAllPostsMenuItem, MoveToAlignmentMenuItem, SuggestAlignmentMenuItem, BanUserFromAllPersonalPostsMenuItem, MoveToAnswersMenuItem, NotifyMeButton, ToggleIsModeratorComment } = Components
  
  const { document: postDetails } = useSingle({
    skip: !post,
    documentId: post?._id,
    collectionName: "Posts",
    fetchPolicy: "cache-first",
    fragmentName: "PostsDetails",
  });
  
  return <>
    <EditCommentMenuItem comment={comment} showEdit={showEdit}/>
    {post && comment.shortform && !comment.topLevelCommentId && (comment.user?._id && (comment.user._id !== currentUser._id)) &&
      <MenuItem>
        <NotifyMeButton document={post} showIcon
          subscriptionType={subscriptionTypes.newShortform}
          subscribeMessage={`Notify me of additions to ${post.title}`}
          unsubscribeMessage={`Stop notifying me of additions to ${post.title}`}
        />
      </MenuItem>
    }
    <MenuItem>
      <NotifyMeButton document={comment} showIcon
        subscribeMessage="Notify me of comment replies"
        unsubscribeMessage="Stop notifying me of comment replies"
      />
    </MenuItem>
    {comment.user?._id && (comment.user._id !== currentUser._id) &&
      <MenuItem>
        <NotifyMeButton document={comment.user} showIcon
          subscribeMessage={"Notify me of new posts by "+userGetDisplayName(comment.user)}
          unsubscribeMessage={"Stop notifying me of new posts by "+userGetDisplayName(comment.user)}
        />
      </MenuItem>
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
  </>
}

const CommentActionsComponent = registerComponent("CommentActions", CommentActions);

declare global {
  interface ComponentTypes {
    CommentActions: typeof CommentActionsComponent,
  }
}
