import { useCallback } from 'react';
import { useMutation } from '@apollo/client/react';
import { gql } from '@/lib/generated/gql-codegen';
import { postStatuses } from '@/lib/collections/posts/constants';
import { useMessages } from '@/components/common/withMessages';
import type { InboxAction } from './inboxReducer';

const UpdateReportMutation = gql(`
  mutation updateReportReportActions($selector: SelectorInput!, $data: UpdateReportDataInput!) {
    updateReport(selector: $selector, data: $data) {
      data {
        _id
        closedAt
        claimedUserId
        markedAsSpam
      }
    }
  }
`);

const UpdateCommentMutation = gql(`
  mutation updateCommentReportActions($selector: SelectorInput!, $data: UpdateCommentDataInput!) {
    updateComment(selector: $selector, data: $data) {
      data {
        ...CommentsList
      }
    }
  }
`);

const UpdatePostMutation = gql(`
  mutation updatePostReportActions($selector: SelectorInput!, $data: UpdatePostDataInput!) {
    updatePost(selector: $selector, data: $data) {
      data {
        ...PostsList
      }
    }
  }
`);

export function useReportActions(
  report: UnclaimedReportsList | null,
  currentUser: UsersCurrent,
  dispatch: React.Dispatch<InboxAction>
) {
  const { flash } = useMessages();
  const [updateReport] = useMutation(UpdateReportMutation);
  const [updateComment] = useMutation(UpdateCommentMutation);
  const [updatePost] = useMutation(UpdatePostMutation);

  const markAsReviewed = useCallback(async () => {
    if (!report) return;
    dispatch({ type: 'REMOVE_REPORT', reportId: report._id });
    try {
      await updateReport({
        variables: {
          selector: { _id: report._id },
          data: {
            closedAt: new Date(),
            claimedUserId: currentUser._id,
            markedAsSpam: false,
          },
        },
      });
    } catch (error) {
      flash({ messageString: `Failed to mark report as reviewed (reload to see it again): ${error instanceof Error ? error.message : String(error)}`, type: 'error' });
    }
  }, [report, currentUser, updateReport, dispatch, flash]);

  const deleteContent = useCallback(async () => {
    if (!report || (!report.comment && !report.post)) return;
    if (!confirm(`Are you sure you want to immediately delete this ${report.comment ? "comment" : "post"}?`)) return;
    dispatch({ type: 'REMOVE_REPORT', reportId: report._id });
    try {
      if (report.comment) {
        await updateComment({
          variables: {
            selector: { _id: report.comment._id },
            data: {
              deleted: true,
              deletedDate: new Date(),
              deletedByUserId: currentUser._id,
              deletedReason: "spam",
            },
          },
        });
      } else if (report.post) {
        await updatePost({
          variables: {
            selector: { _id: report.post._id },
            data: {
              status: report.reportedAsSpam
                ? postStatuses.STATUS_SPAM
                : postStatuses.STATUS_DELETED,
            },
          },
        });
      }
      // Only close the report once the content is actually gone
      await updateReport({
        variables: {
          selector: { _id: report._id },
          data: {
            closedAt: new Date(),
            claimedUserId: currentUser._id,
            markedAsSpam: report.reportedAsSpam,
          },
        },
      });
    } catch (error) {
      flash({ messageString: `Failed to delete reported content (reload to see the report again): ${error instanceof Error ? error.message : String(error)}`, type: 'error' });
    }
  }, [report, currentUser, updateComment, updatePost, updateReport, dispatch, flash]);

  return {
    markAsReviewed,
    deleteContent,
  };
}
