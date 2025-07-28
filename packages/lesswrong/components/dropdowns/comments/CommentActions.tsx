import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { userCanModeratePost } from '../../../lib/collections/users/helpers';
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
import ShortformFrontpageDropdownItem from "./ShortformFrontpageDropdownItem";
import { CommentSubscriptionsDropdownItem } from "./CommentSubscriptionsDropdownItem";
import BanUserFromPostDropdownItem from "./BanUserFromPostDropdownItem";
import LockThreadDropdownItem from "./LockThreadDropdownItem";
import { useCurrentUser } from '@/components/common/withUser';
import BookmarkDropdownItem from "../posts/BookmarkDropdownItem";


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

  return (
    <DropdownMenu>
      <EditCommentDropdownItem comment={comment} showEdit={showEdit} />
      <PinToProfileDropdownItem comment={comment} post={post} />
      <BookmarkDropdownItem documentId={comment._id} collectionName="Comments" preventMenuClose />
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

export default registerComponent("CommentActions", CommentActions);


