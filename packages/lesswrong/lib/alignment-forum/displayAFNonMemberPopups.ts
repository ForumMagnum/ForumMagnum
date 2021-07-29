import {userNeedsAFNonMemberWarning} from "./users/helpers";
import {commentSuggestForAlignment} from "./comments/helpers";
import {postSuggestForAlignment} from "./posts/helpers";
import {OpenDialogContext, OpenDialogContextType} from "../../components/common/withDialog";


const isComment = (document: PostsBase | CommentsList) : document is CommentsList => {
  if (document.hasOwnProperty("postId")) return true
  return false
}

export const afNonMemberSuccessHandling = ({currentUser, document, openDialog, updateDocument}: {
    currentUser: UsersCurrent|null,
    document: PostsBase | CommentsList,
    openDialog: OpenDialogContextType["openDialog"], //TODO: let's come back to this
    updateDocument: WithUpdateFunction<CommentsCollection | PostsCollection> //TODO: gah, what is this?
  }) => {
  //displays explanation of what happens upon non-member submission and submits to queue
  
  if (!!currentUser && userNeedsAFNonMemberWarning(currentUser, false)) { 
    if (isComment(document)) {
      commentSuggestForAlignment({currentUser, comment: document, updateComment: updateDocument}) 
      openDialog({
        componentName: "AFNonMemberSuccessPopup",
        componentProps: {_id: document._id, postId: document?.postId}
      })
    } else {
      postSuggestForAlignment({currentUser, post: document, updatePost: updateDocument})
      openDialog({
        componentName: "AFNonMemberSuccessPopup",
        componentProps: {_id: document._id}
      })
    }
  }
}
