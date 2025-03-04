import {userNeedsAFNonMemberWarning} from "./users/helpers";
import {commentSuggestForAlignment} from "./comments/helpers";
import {postSuggestForAlignment} from "./posts/helpers";
import {OpenDialogContextType} from "../../components/common/withDialog";


const isComment = (document: PostsBase | CommentsList): document is CommentsList => {
  if ('answer' in document) return true //only comments can be answers
  return false
}

export const afNonMemberDisplayInitialPopup = (currentUser: UsersCurrent|null, openDialog: OpenDialogContextType["openDialog"]): boolean => {
  if (userNeedsAFNonMemberWarning(currentUser)) { //only fires on AF for non-members
    openDialog({componentName: "AFNonMemberInitialPopup"})
    return true;
  }
  return false;
}

export const afNonMemberSuccessHandling = ({currentUser, document, openDialog, updateDocument}: {
  currentUser: UsersCurrent|null,
  document: PostsBase | CommentsList,
  openDialog: OpenDialogContextType["openDialog"],
  updateDocument: WithUpdateFunction<"Comments" | "Posts">
}) => {
  //displays explanation of what happens upon non-member submission and submits to queue

  if (!!currentUser && userNeedsAFNonMemberWarning(currentUser, false)) {
    if (isComment(document)) {
      void commentSuggestForAlignment({currentUser, comment: document, updateComment: updateDocument})
      openDialog({
        componentName: "AFNonMemberSuccessPopup",
        componentProps: {_id: document._id, postId: document.postId}
      })
    } else {
      void postSuggestForAlignment({currentUser, post: document, updatePost: updateDocument})
      openDialog({
        componentName: "AFNonMemberSuccessPopup",
        componentProps: {_id: document._id}
      })
    }
  }
}
