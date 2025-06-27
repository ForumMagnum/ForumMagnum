import React, { useCallback } from 'react';
import {userNeedsAFNonMemberWarning} from "./users/helpers";
import {OpenDialogContextType, useDialog} from "../../components/common/withDialog";
import AFNonMemberInitialPopup from '@/components/alignment-forum/AFNonMemberInitialPopup';
import AFNonMemberSuccessPopup from '@/components/alignment-forum/AFNonMemberSuccessPopup';
import { useMutation } from "@apollo/client/react";
import { gql } from '@/lib/generated/gql-codegen';
import uniq from 'lodash/uniq';
import { useCurrentUser } from '@/components/common/withUser';

const SuggestAlignmentCommentUpdateMutation = gql(`
  mutation updateCommentCommentsNewForm($selector: SelectorInput!, $data: UpdateCommentDataInput!) {
    updateComment(selector: $selector, data: $data) {
      data {
        ...SuggestAlignmentComment
      }
    }
  }
`);

const SuggestAlignmentPostUpdateMutation = gql(`
  mutation updatePostPostsEditForm($selector: SelectorInput!, $data: UpdatePostDataInput!) {
    updatePost(selector: $selector, data: $data) {
      data {
        ...SuggestAlignmentPost
      }
    }
  }
`);

const isComment = (document: PostsBase | CommentsList): document is CommentsList => {
  if ('answer' in document) return true //only comments can be answers
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

//displays explanation of what happens upon non-member submission and submits to queue
export const useAfNonMemberSuccessHandling = () => {
  const currentUser = useCurrentUser();
  const { openDialog } = useDialog();
  const [updateComment] = useMutation(SuggestAlignmentCommentUpdateMutation);
  const [updatePost] = useMutation(SuggestAlignmentPostUpdateMutation);
  
  return useCallback((document: PostsBase | CommentsList) => {
    if (!!currentUser && userNeedsAFNonMemberWarning(currentUser, false)) {
      if (isComment(document)) {
        void updateComment({
          variables: {
            selector: { _id: document._id},
            data: {suggestForAlignmentUserIds: uniq([...document.suggestForAlignmentUserIds, currentUser._id])}
          }
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
        void updatePost({
          variables: {
            selector: { _id: document._id },
            data: { suggestForAlignmentUserIds: uniq([...document.suggestForAlignmentUserIds, currentUser._id]) }
          }
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
  }, [currentUser, openDialog, updateComment, updatePost]);
}
