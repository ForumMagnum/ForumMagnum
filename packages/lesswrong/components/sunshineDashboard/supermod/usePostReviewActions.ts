import { useCallback } from 'react';
import { useMutation } from '@apollo/client/react';
import { gql } from '@/lib/generated/gql-codegen';
import { MANUAL_FLAG_ALERT } from '@/lib/collections/moderatorActions/constants';
import { userGetProfileUrl } from '@/lib/collections/users/helpers';
import type { InboxAction } from './inboxReducer';

const PostsListUpdateMutation = gql(`
  mutation updatePostPostReviewActions($selector: SelectorInput!, $data: UpdatePostDataInput!) {
    updatePost(selector: $selector, data: $data) {
      data {
        ...PostsList
      }
    }
  }
`);

const ModeratorActionsCreateMutation = gql(`
  mutation createModeratorActionPostReviewActions($data: CreateModeratorActionDataInput!) {
    createModeratorAction(data: $data) {
      data {
        _id
      }
    }
  }
`);

export function usePostReviewActions(
  post: SunshinePostsList | null,
  currentUser: UsersCurrent,
  dispatch: React.Dispatch<InboxAction>
) {
  const [updatePost] = useMutation(PostsListUpdateMutation);
  const [createModeratorAction] = useMutation(ModeratorActionsCreateMutation);

  const markAsPersonal = useCallback(async () => {
    if (!post || !currentUser) return;
    dispatch({ type: 'REMOVE_POST', postId: post._id });
    await updatePost({
      variables: {
        selector: { _id: post._id },
        data: {
          frontpageDate: null,
          reviewedByUserId: currentUser._id,
          authorIsUnreviewed: false,
        },
      },
    });
  }, [post, currentUser, updatePost, dispatch]);

  const markAsFrontpage = useCallback(async () => {
    if (!post || !currentUser) return;
    dispatch({ type: 'REMOVE_POST', postId: post._id });
    await updatePost({
      variables: {
        selector: { _id: post._id },
        data: {
          frontpageDate: new Date(),
          reviewedByUserId: currentUser._id,
          authorIsUnreviewed: false,
        },
      },
    });
  }, [post, currentUser, updatePost, dispatch]);

  const moveToDraft = useCallback(async () => {
    if (!post) return;
    if (confirm("Are you sure you want to move this post to the author's draft?")) {
      window.open(userGetProfileUrl(post.user), '_blank');
      dispatch({ type: 'REMOVE_POST', postId: post._id });
      await updatePost({
        variables: {
          selector: { _id: post._id },
          data: {
            draft: true,
          },
        },
      });
    }
  }, [post, updatePost, dispatch]);

  const flagUser = useCallback(async () => {
    if (!post) return;
    const lastManualUserFlag = post.user?.moderatorActions?.find(
      action => action.type === MANUAL_FLAG_ALERT
    );
    const isUserAlreadyFlagged = post.user?.needsReview || lastManualUserFlag?.active;

    if (isUserAlreadyFlagged) return;

    if (post.user) {
      dispatch({
        type: 'UPDATE_POST',
        postId: post._id,
        fields: {
          user: {
            ...post.user,
            needsReview: true,
          },
        },
      });
    }

    await createModeratorAction({
      variables: {
        data: {
          type: MANUAL_FLAG_ALERT,
          userId: post.userId,
        },
      },
    });
  }, [post, createModeratorAction, dispatch]);

  return {
    markAsPersonal,
    markAsFrontpage,
    moveToDraft,
    flagUser,
  };
}

