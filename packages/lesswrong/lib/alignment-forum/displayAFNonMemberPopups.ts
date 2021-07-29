import {userNeedsAFNonMemberWarning} from "./users/helpers";
import {commentSuggestForAlignment} from "./comments/helpers";
import {postSuggestForAlignment} from "./posts/helpers";
import {OpenDialogContext} from "../../components/common/withDialog";

export const AFNonMemberSuccessHandling = ({currentUser, document, openDialog, updateDocument}: {
    currentUser: UsersCurrent|null,
    document: any,
    openDialog: any, //TODO: let's come back to this
    updateDocument: WithUpdateFunction<any> //TODO: gah, what is this?
  }) => {
  //displays explanation of what happens upon non-member submission and submits to queue
  
  console.log("AFNonMemberHandling Fired!!")
  
  if (!!currentUser && userNeedsAFNonMemberWarning(currentUser, false)) {
    const isComment = document.hasOwnProperty("postId")

    console.log("AFNonMemberHandling Fired!! 22222")

    if (isComment) {
      console.log("suggesting comment")
      const comment = document as CommentsList
      const updateComment = updateDocument as WithUpdateFunction<any>
      // commentSuggestForAlignment({currentUser, comment, updateComment})

    } else {
      const post = document as PostsBase
      const updatePost = updateDocument as WithUpdateFunction<any>
      // postSuggestForAlignment({currentUser, post, updatePost})
    }
    
    // const suggestFunction = isComment ? commentSuggestForAlignment : postSuggestForAlignment
    // suggestFunction({currentUser, document, updateDocument})
    // openDialog({
    //   componentName: "AFNonMemberSuccessPopup",
    //   componentProps: {_id: document._id, postId: document?.postId}
    // })
  }
}

