import {userNeedsAFNonMemberWarning} from "./users/helpers";
import {commentSuggestForAlignment} from "./comments/helpers";
import {postSuggestForAlignment} from "./posts/helpers";
import {OpenDialogContextType} from "../../components/common/withDialog";


const isComment = (document: PostsBase | CommentsList) : document is CommentsList => {
  if (document.hasOwnProperty("postId")) return true
  return false
}

export const afNonMemberDisplayInitialPopup = (currentUser: UsersCurrent|null, openDialog: OpenDialogContextType["openDialog"]) => {
  if (userNeedsAFNonMemberWarning(currentUser)) { //only fires on AF for non-members
    openDialog({componentName: "AFNonMemberInitialPopup"})
  }
}
  
export const afNonMemberSuccessHandling = ({currentUser, document, openDialog, updateDocument}: {
  currentUser: UsersCurrent|null,
  document: PostsBase | CommentsList,
  openDialog: OpenDialogContextType["openDialog"],
  updateDocument: WithUpdateFunction<CommentsCollection | PostsCollection>
}) => {
//displays explanation of what happens upon non-member submission and submits to queue

  console.log('success popup code firing')
  
  if (!!currentUser && userNeedsAFNonMemberWarning(currentUser, false)) { 
    if (isComment(document)) {
      commentSuggestForAlignment({currentUser, comment: document, updateComment: updateDocument}) 
      openDialog({
        componentName: "AFNonMemberSuccessPopup",
        componentProps: {_id: document._id, postId: document.postId}
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


//   <div className={classes.afNonMemberPopDiv} onFocus={(ev) => {
//   if (userNeedsAFNonMemberWarning(currentUser)) { //only fires on AF for non-members
//     openDialog({componentName: "AFNonMemberInitialPopup"})
//   }
// }}>
