import { useForumType } from '@/components/hooks/useForumType';
import type { ForumTypeString } from '@/lib/instanceSettings';
import React, { useCallback } from 'react';
import {userNeedsAFNonMemberWarning} from "./users/helpers";
import {OpenDialogContextType, useDialog} from "../../components/common/withDialog";
import { useMutation } from "@apollo/client/react";
import { useCurrentUser } from '@/components/common/withUser';
import { SetCommentSuggestedForAlignmentMutation, SetPostSuggestedForAlignmentMutation } from '@/components/alignment-forum/alignmentSuggestionMutations';

import dynamic from 'next/dynamic';
const AFNonMemberInitialPopup = dynamic(() => import("@/components/alignment-forum/AFNonMemberInitialPopup"), { ssr: false });
const AFNonMemberSuccessPopup = dynamic(() => import("@/components/alignment-forum/AFNonMemberSuccessPopup"), { ssr: false });

const isComment = (document: PostsBase | CommentsList): document is CommentsList => {
  if ('answer' in document) return true //only comments can be answers
  return false
}

export const afNonMemberDisplayInitialPopup = (currentUser: UsersCurrent|null, openDialog: OpenDialogContextType["openDialog"], forumType: ForumTypeString): boolean => {
  if (userNeedsAFNonMemberWarning(currentUser, forumType)) { //only fires on AF for non-members
    openDialog({
      name: "AFNonMemberInitialPopup",
      contents: ({onClose}) => <AFNonMemberInitialPopup onClose={onClose}/>
    });

    return true;
  }
  return false;
}

//displays explanation of what happens upon non-member submission and submits to queue
export const useAfNonMemberSuccessHandling = () => {
  const { forumType } = useForumType();
  const currentUser = useCurrentUser();
  const { openDialog } = useDialog();
  const [setCommentSuggestedForAlignment] = useMutation(SetCommentSuggestedForAlignmentMutation);
  const [setPostSuggestedForAlignment] = useMutation(SetPostSuggestedForAlignmentMutation);
  
  return useCallback((document: PostsBase | CommentsList) => {
    if (!!currentUser && userNeedsAFNonMemberWarning(currentUser, forumType, false)) {
      if (isComment(document)) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        void setCommentSuggestedForAlignment({
          variables: { commentId: document._id, suggested: true }
        });
        openDialog({
          name: "AFNonMemberSuccessPopup",
          contents: ({onClose}) => <AFNonMemberSuccessPopup
            _id={document._id}
            postId={document.postId ?? undefined}
            onClose={onClose}
          />,
        })
      } else {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        void setPostSuggestedForAlignment({
          variables: { postId: document._id, suggested: true }
        })
        openDialog({
          name: "AFNonMemberSuccessPopup",
          contents: ({onClose}) => <AFNonMemberSuccessPopup
            onClose={onClose}
            _id={document._id}
          />,
        })
      }
    }
  }, [currentUser, openDialog, setCommentSuggestedForAlignment, setPostSuggestedForAlignment, forumType]);
}
