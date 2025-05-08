import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import { userCanModeratePost } from '../../../lib/collections/users/helpers';
import { useSingle } from '../../../lib/crud/withSingle';

const CommentActionsInner = ({currentUser, comment, post, tag, showEdit}: {
  currentUser: UsersCurrent, // Must be logged in
  comment: CommentsList,
  post?: PostsMinimumInfo,
  tag?: TagBasicInfo,
  showEdit: () => void,
}) => {
  const {
    EditCommentDropdownItem, ReportCommentDropdownItem, DeleteCommentDropdownItem,
    RetractCommentDropdownItem, BanUserFromAllPostsDropdownItem, DropdownDivider,
    MoveToAlignmentCommentDropdownItem, SuggestAlignmentCommentDropdownItem,
    BanUserFromAllPersonalPostsDropdownItem, MoveToAnswersDropdownItem,
    ToggleIsModeratorCommentDropdownItem, PinToProfileDropdownItem,
    DropdownMenu, ShortformFrontpageDropdownItem, CommentSubscriptionsDropdownItem,
    BanUserFromPostDropdownItem, LockThreadDropdownItem,
  } = Components;

  const {document: postDetails} = useSingle({
    skip: !post,
    documentId: post?._id,
    collectionName: "Posts",
    fetchPolicy: "cache-first",
    fragmentName: "PostsDetails",
  });

  // WARNING: Clickable items in this menu must be full-width, and
  // ideally should use the <DropdownItem> component. In particular,
  // do NOT wrap a <MenuItem> around something that has its own
  // onClick handler; the onClick handler should either be on the
  // MenuItem, or on something outside of it. Putting an onClick
  // on an element inside of a MenuItem can create a dead-space
  // click area to the right of the item which looks like you've
  // selected the thing, and closes the menu, but doesn't do the
  // thing.

  return (
    <DropdownMenu>
      <EditCommentDropdownItem comment={comment} showEdit={showEdit} />
      <PinToProfileDropdownItem comment={comment} post={post} />
      <CommentSubscriptionsDropdownItem comment={comment} post={post} />
      <ReportCommentDropdownItem comment={comment} post={post} />
      <MoveToAlignmentCommentDropdownItem comment={comment} post={postDetails} />
      <SuggestAlignmentCommentDropdownItem comment={comment} post={postDetails} />

      {postDetails &&
        userCanModeratePost(currentUser, postDetails) &&
        postDetails.user &&
          <DropdownDivider />
      }

      <MoveToAnswersDropdownItem comment={comment} post={postDetails} />
      <ShortformFrontpageDropdownItem comment={comment} />
      <DeleteCommentDropdownItem comment={comment} post={postDetails} tag={tag} />
      <RetractCommentDropdownItem comment={comment} />
      <LockThreadDropdownItem comment={comment} />
      <BanUserFromPostDropdownItem comment={comment} post={postDetails} />
      <BanUserFromAllPostsDropdownItem comment={comment} post={postDetails} />
      <BanUserFromAllPersonalPostsDropdownItem comment={comment} post={postDetails} />
      <ToggleIsModeratorCommentDropdownItem comment={comment} />
    </DropdownMenu>
  );
}

export const CommentActions = registerComponent("CommentActions", CommentActionsInner);

declare global {
  interface ComponentTypes {
    CommentActions: typeof CommentActions,
  }
}
