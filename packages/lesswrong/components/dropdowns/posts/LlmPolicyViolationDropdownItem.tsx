import { useMessages } from '@/components/common/withMessages';
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
  const { flash } = useMessages();
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
            displayName={post.user?.displayName}
            rejectContent={async (reason) => {
              const succeeded = await rejectContent({
                collectionName: "Posts",
                document: post,
                reason,
              });
              if (!succeeded) return false;
              // Also unapprove the user
              void updateUser({
                variables: {
                  selector: { _id: post.userId },
                  data: {
                    reviewedByUserId: null,
                    needsReview: true,
                  },
                },
              }).catch(error => {
                flash({ messageString: `Content was rejected, but the user could not be unapproved: ${error.message}`, type: "error" });
              });
              return true;
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
