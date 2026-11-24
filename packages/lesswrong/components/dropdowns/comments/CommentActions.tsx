import React from 'react';
import { userCanModeratePost } from '../../../lib/collections/users/helpers';
import { userIsAdminOrMod, userOwns } from '../../../lib/vulcan-users/permissions';
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import EditCommentDropdownItem from "./EditCommentDropdownItem";
import ReportCommentDropdownItem from "./ReportCommentDropdownItem";
import DeleteCommentDropdownItem from "./DeleteCommentDropdownItem";
import RetractCommentDropdownItem from "./RetractCommentDropdownItem";
import BanUserFromAllPostsDropdownItem from "./BanUserFromAllPostsDropdownItem";
import DropdownDivider from "../DropdownDivider";
import MoveToAlignmentCommentDropdownItem from "./MoveToAlignmentCommentDropdownItem";
import SuggestAlignmentCommentDropdownItem from "./SuggestAlignmentCommentDropdownItem";
import BanUserFromAllPersonalPostsDropdownItem from "./BanUserFromAllPersonalPostsDropdownItem";
import MoveToAnswersDropdownItem from "./MoveToAnswersDropdownItem";
import ToggleIsModeratorCommentDropdownItem from "./ToggleIsModeratorCommentDropdownItem";
import PinToProfileDropdownItem from "./PinToProfileDropdownItem";
import DropdownMenu from "../DropdownMenu";
import CopyMarkdownDropdownItem from "../CopyMarkdownDropdownItem";
import ShortformFrontpageDropdownItem from "./ShortformFrontpageDropdownItem";
import QuickTakeTagsDropdownItem from "./QuickTakeTagsDropdownItem";
import { CommentSubscriptionsDropdownItem } from "./CommentSubscriptionsDropdownItem";
import BanUserFromPostDropdownItem from "./BanUserFromPostDropdownItem";
import LockThreadDropdownItem from "./LockThreadDropdownItem";
import { useCurrentUser } from '@/components/common/withUser';
import BookmarkDropdownItem from "../posts/BookmarkDropdownItem";
import ModeratorActionsSubmenu from "../ModeratorActionsSubmenu";


const PostsDetailsQuery = gql(`
  query CommentActions($documentId: String) {
    post(input: { selector: { documentId: $documentId } }) {
      result {
        ...PostsDetails
      }
    }
  }
`);

const CommentActions = ({comment, post, tag, showEdit}: {
  comment: CommentsList,
  post?: PostsMinimumInfo,
  tag?: TagBasicInfo,
  showEdit: () => void,
}) => {
  const currentUser = useCurrentUser();
  const { data } = useQuery(PostsDetailsQuery, {
    variables: { documentId: post?._id },
    skip: !post,
    fetchPolicy: "cache-first",
  });
  const postDetails = data?.post?.result ?? undefined;

  // WARNING: Clickable items in this menu must be full-width, and
  // ideally should use the <DropdownItem> component. In particular,
  // do NOT wrap a <MenuItem> around something that has its own
  // onClick handler; the onClick handler should either be on the
  // MenuItem, or on something outside of it. Putting an onClick
  // on an element inside of a MenuItem can create a dead-space
  // click area to the right of the item which looks like you've
  // selected the thing, and closes the menu, but doesn't do the
  // thing.

  // Moderators and admins see moderator-only actions grouped into a submenu,
  // as in PostActions. An action that regular users can take on their own
  // comments, or on comments on their own posts, goes in the submenu if the
  // current user is neither and so can only take it because they're a
  // moderator.
  const showModeratorSubmenu = userIsAdminOrMod(currentUser);
  const ownsPost = !!postDetails && userOwns(currentUser, postDetails);
  const commentAuthorActionsAreModeratorOnly = showModeratorSubmenu && !userOwns(currentUser, comment);
  const deleteIsModeratorOnly = commentAuthorActionsAreModeratorOnly && !ownsPost;
  const banFromPostIsModeratorOnly = showModeratorSubmenu && !ownsPost;

  const editItems = <>
    <EditCommentDropdownItem comment={comment} showEdit={showEdit} />
    <PinToProfileDropdownItem comment={comment} post={post} />
  </>;
  const commentAuthorItems = <>
    <MoveToAnswersDropdownItem comment={comment} post={postDetails} />
    <QuickTakeTagsDropdownItem comment={comment} />
    <ShortformFrontpageDropdownItem comment={comment} />
  </>;
  const deleteItem = <DeleteCommentDropdownItem comment={comment} post={postDetails} tag={tag} />;
  const banFromPostItem = <BanUserFromPostDropdownItem comment={comment} post={postDetails} />;

  const moderatorItems = <>
    {commentAuthorActionsAreModeratorOnly && editItems}
    {commentAuthorActionsAreModeratorOnly && commentAuthorItems}
    {deleteIsModeratorOnly && deleteItem}
    <LockThreadDropdownItem comment={comment} />
    {banFromPostIsModeratorOnly && banFromPostItem}
    <ToggleIsModeratorCommentDropdownItem comment={comment} />
  </>;

  return (
    <DropdownMenu>
      {!commentAuthorActionsAreModeratorOnly && editItems}
      <CommentSubscriptionsDropdownItem comment={comment} post={post} />
      {!comment.draft && <BookmarkDropdownItem documentId={comment._id} collectionName="Comments" preventMenuClose />}
      <ReportCommentDropdownItem comment={comment} post={post} />
      {comment.postId && <CopyMarkdownDropdownItem path={`/api/post/${comment.postId}/comments/${comment._id}`} />}
      <MoveToAlignmentCommentDropdownItem comment={comment} post={postDetails} />
      <SuggestAlignmentCommentDropdownItem comment={comment} post={postDetails} />

      {postDetails &&
        (ownsPost || userCanModeratePost(currentUser, postDetails).canModerate) &&
        postDetails.user &&
          <DropdownDivider />
      }

      {!commentAuthorActionsAreModeratorOnly && commentAuthorItems}
      {!deleteIsModeratorOnly && deleteItem}
      <RetractCommentDropdownItem comment={comment} />
      {!banFromPostIsModeratorOnly && banFromPostItem}
      <BanUserFromAllPostsDropdownItem comment={comment} post={postDetails} />
      <BanUserFromAllPersonalPostsDropdownItem comment={comment} post={postDetails} />
      {showModeratorSubmenu && <ModeratorActionsSubmenu>{moderatorItems}</ModeratorActionsSubmenu>}
    </DropdownMenu>
  );
}

export default CommentActions;


