import {userNeedsAFNonMemberWarning} from "./users/helpers";
import {commentSuggestForAlignment} from "./comments/helpers";
import {postSuggestForAlignment} from "./posts/helpers";
import {OpenDialogContextType} from "../../components/common/withDialog";

type HandleComment = {
  currentUser: UsersCurrent|null,
  document: CommentsList,
  openDialog: OpenDialogContextType["openDialog"],
  updateDocument: WithUpdateFunction<CommentsCollection>
};

type HandlePost = {
  currentUser: UsersCurrent|null,
  document: PostsBase,
  openDialog: OpenDialogContextType["openDialog"],
  updateDocument: WithUpdateFunction<PostsCollection>
};

type AfNonMemberSuccessHandlingProps = HandlePost | HandleComment;

const isComment = (props: AfNonMemberSuccessHandlingProps) : props is HandleComment => {
  if (props.document.hasOwnProperty("answer")) return true //only comments can be answers
  return false
}

export const afNonMemberDisplayInitialPopup = (currentUser: UsersCurrent|null, openDialog: OpenDialogContextType["openDialog"]): boolean => {
  if (userNeedsAFNonMemberWarning(currentUser)) { //only fires on AF for non-members
    openDialog({componentName: "AFNonMemberInitialPopup"})
    return true;
  }
  return false;
}

export const afNonMemberSuccessHandling = (props: AfNonMemberSuccessHandlingProps) => {
//displays explanation of what happens upon non-member submission and submits to queue
  const {currentUser, openDialog} = props;
  if (!!currentUser && userNeedsAFNonMemberWarning(currentUser, false)) { 
    if (isComment(props)) {
      
      void commentSuggestForAlignment({currentUser, comment: props.document, updateComment: props.updateDocument}) 
      openDialog({
        componentName: "AFNonMemberSuccessPopup",
        componentProps: {_id: props.document._id, postId: props.document.postId}
      })
    } else {
      void postSuggestForAlignment({currentUser, post: props.document, updatePost: props.updateDocument})
      openDialog({
        componentName: "AFNonMemberSuccessPopup",
        componentProps: {_id: props.document._id}
      })
    }
  }
}
