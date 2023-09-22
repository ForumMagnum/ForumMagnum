import {userNeedsAFNonMemberWarning} from "./users/helpers";
import {commentSuggestForAlignment} from "./comments/helpers";
import {postSuggestForAlignment} from "./posts/helpers";
import {OpenDialogContextType} from "../../components/common/withDialog";
import type {UpdateCommentCallback} from "../../components/hooks/useUpdateComment";

export const afNonMemberDisplayInitialPopup = (currentUser: UsersCurrent|null, openDialog: OpenDialogContextType["openDialog"]): boolean => {
  if (userNeedsAFNonMemberWarning(currentUser)) { //only fires on AF for non-members
    openDialog({componentName: "AFNonMemberInitialPopup"})
    return true;
  }
  return false;
}

export const afCommentNonMemberSuccessHandling = ({currentUser, comment, openDialog, updateComment}: {
  currentUser: UsersCurrent|null,
  comment: CommentsList,
  openDialog: OpenDialogContextType["openDialog"],
  updateComment: UpdateCommentCallback,
}) => {
  //displays explanation of what happens upon non-member submission and submits to queue

  if (!!currentUser && userNeedsAFNonMemberWarning(currentUser, false)) {
    void commentSuggestForAlignment({currentUser, comment, updateComment})
    openDialog({
      componentName: "AFNonMemberSuccessPopup",
      componentProps: {_id: comment._id, postId: comment.postId}
    })
  }
}

export const afPostNonMemberSuccessHandling = ({currentUser, post, openDialog, updatePost}: {
  currentUser: UsersCurrent|null,
  post: PostsBase,
  openDialog: OpenDialogContextType["openDialog"],
  updatePost: WithUpdateFunction<PostsCollection>
}) => {
  //displays explanation of what happens upon non-member submission and submits to queue

  if (!!currentUser && userNeedsAFNonMemberWarning(currentUser, false)) {
    void postSuggestForAlignment({currentUser, post, updatePost: updatePost})
    openDialog({
      componentName: "AFNonMemberSuccessPopup",
      componentProps: {_id: post._id}
    })
  }
}
