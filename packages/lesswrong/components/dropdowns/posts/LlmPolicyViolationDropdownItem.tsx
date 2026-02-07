import React from "react";
import { useCurrentUser } from "../../common/withUser";
import { userIsAdmin } from "../../../lib/vulcan-users/permissions";
import DropdownItem from "../DropdownItem";
import { useDialog } from "../../common/withDialog";
import { useRejectContent } from "../../hooks/useRejectContent";
import { useMutation } from "@apollo/client/react";
import { gql } from "@/lib/generated/gql-codegen";
import RejectContentDialog from "../../sunshineDashboard/RejectContentDialog";
import LlmPolicyViolationDialog from "./LlmPolicyViolationDialog";

const unlistLlmPostMutation = gql(`
  mutation unlistLlmPost($postId: String!, $modCommentHtml: String!) {
    unlistLlmPost(postId: $postId, modCommentHtml: $modCommentHtml)
  }
`);

const unapproveUserMutation = gql(`
  mutation unapproveUserLlmPolicyViolation($selector: SelectorInput!, $data: UpdateUserDataInput!) {
    updateUser(selector: $selector, data: $data) {
      data {
        ...UsersMinimumInfo
      }
    }
  }
`);

const LlmPolicyViolationDropdownItem = ({post, closeMenu}: {
  post: PostsList | SunshinePostsList,
  closeMenu: () => void,
}) => {
  const currentUser = useCurrentUser();
  const { openDialog } = useDialog();
  const { rejectContent, rejectionTemplates } = useRejectContent();
  const [unlistLlmPost] = useMutation(unlistLlmPostMutation);
  const [updateUser] = useMutation(unapproveUserMutation);

  if (!userIsAdmin(currentUser)) {
    return null;
  }

  const hasComments = (post.commentCount ?? 0) > 0;

  const handleClick = () => {
    closeMenu();
    if (hasComments) {
      openDialog({
        name: "LlmPolicyViolationDialog",
        contents: ({onClose}) => (
          <LlmPolicyViolationDialog
            post={post}
            onClose={onClose}
            onSubmit={async (modCommentHtml) => {
              await unlistLlmPost({
                variables: { postId: post._id, modCommentHtml },
              });
            }}
          />
        ),
      });
    } else {
      openDialog({
        name: "RejectContentDialog",
        contents: ({onClose}) => (
          <RejectContentDialog
            rejectionTemplates={rejectionTemplates}
            rejectContent={(reason) => {
              void rejectContent({
                collectionName: "Posts",
                // This expects a SunshinePostsList because useRejectContent does an optimisticResponse
                // for its mutation, but the mutation itself returns a SunshinePostsList, so it
                // expects the optimisticResponse to match. In this case it doesn't matter if the
                // optimistic response is missing some fields, since we're in a context where we
                // didn't have those fields anyways.
                document: post as SunshinePostsList,
                reason,
              });
              // Also unapprove the user
              void updateUser({
                variables: {
                  selector: { _id: post.userId },
                  data: {
                    reviewedByUserId: null,
                    needsReview: true,
                  },
                },
              });
            }}
            onClose={onClose}
          />
        ),
      });
    }
  };

  return (
    <DropdownItem
      title="LLM Policy Violation"
      onClick={handleClick}
    />
  );
};

export default LlmPolicyViolationDropdownItem;
