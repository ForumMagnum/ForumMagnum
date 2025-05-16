import React from 'react';
import {userNeedsAFNonMemberWarning} from "./users/helpers";
import {commentSuggestForAlignment} from "./comments/helpers";
import {postSuggestForAlignment} from "./posts/helpers";
import {OpenDialogContextType} from "../../components/common/withDialog";
import AFNonMemberInitialPopup from '@/components/alignment-forum/AFNonMemberInitialPopup';
import AFNonMemberSuccessPopup from '@/components/alignment-forum/AFNonMemberSuccessPopup';


const isComment = (document: PostsBase | CommentsList): document is CommentsList => {
  if (document.hasOwnProperty("answer")) return true //only comments can be answers
  return false
}

export const afNonMemberDisplayInitialPopup = (currentUser: UsersCurrent|null, openDialog: OpenDialogContextType["openDialog"]): boolean => {
  if (userNeedsAFNonMemberWarning(currentUser)) { //only fires on AF for non-members
    openDialog({
      name: "AFNonMemberInitialPopup",
      contents: ({onClose}) => <AFNonMemberInitialPopup onClose={onClose}/>
    })
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
        name: "AFNonMemberSuccessPopup",
        contents: ({onClose}) => <AFNonMemberSuccessPopup
          _id={document._id}
          postId={document.postId ?? undefined}
          onClose={onClose}
        />,
      })
    } else {
      void postSuggestForAlignment({currentUser, post: document, updatePost: updateDocument})
      openDialog({
        name: "AFNonMemberSuccessPopup",
        contents: ({onClose}) => <AFNonMemberSuccessPopup
          onClose={onClose}
          _id={document._id}
        />,
      })
    }
  }
}
