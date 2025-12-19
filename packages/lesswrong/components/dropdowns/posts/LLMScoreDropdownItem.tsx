"use client";
import React from "react";
import { useCurrentUser } from "../../common/withUser";
import { useDialog } from "../../common/withDialog";
import { usePostsPageContext } from "../../posts/PostsPage/PostsPageContext";
import { userIsAdminOrMod } from "../../../lib/vulcan-users/permissions";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import DropdownItem from "../DropdownItem";
import LLMScoreDialog from "../../sunshineDashboard/LLMScoreDialog";

const POST_LLM_SCORE_QUERY = gql(`
  query PostLLMScoreQuery($postId: String!) {
    post(selector: { _id: $postId }) {
      result {
        _id
        contents {
          _id
          html
        }
        automatedContentEvaluations {
          ...AutomatedContentEvaluationsFragment
        }
      }
    }
  }
`);

function LLMScoreDropdownItem({ post, closeMenu }: {
  post: PostsList | SunshinePostsList;
  closeMenu?: () => void;
}) {
  const currentUser = useCurrentUser();
  const { openDialog } = useDialog();
  const postsPageContext = usePostsPageContext();

  const isOnPostPage = postsPageContext !== null;
  const canViewLLMScore = userIsAdminOrMod(currentUser);

  const { data, loading, refetch } = useQuery(POST_LLM_SCORE_QUERY, {
    variables: { postId: post._id },
    skip: !isOnPostPage || !canViewLLMScore,
    ssr: false,
  });

  if (!isOnPostPage || !canViewLLMScore) {
    return null;
  }

  const postWithLLMData = data?.post?.result;
  const automatedContentEvaluations = postWithLLMData?.automatedContentEvaluations;
  const contentHtml = postWithLLMData?.contents?.html ?? '';
  const hasLLMScore = typeof automatedContentEvaluations?.pangramScore === 'number';

  const handleClick = () => {
    closeMenu?.();

    openDialog({
      name: "LLMScoreDialog",
      contents: ({ onClose }) => (
        <LLMScoreDialog
          onClose={onClose}
          documentId={post._id}
          automatedContentEvaluations={automatedContentEvaluations ?? null}
          contentHtml={contentHtml}
          contentType="Post"
          onLlmCheckComplete={refetch}
        />
      ),
    });
  };

  if (loading) {
    return (
      <DropdownItem
        title="LLM Score..."
        icon="Robot"
        disabled
      />
    );
  }

  const title = hasLLMScore 
    ? `View LLM Score (${automatedContentEvaluations.pangramScore?.toFixed(2)})`
    : "Run LLM Check";

  return (
    <DropdownItem
      title={title}
      icon="Robot"
      onClick={handleClick}
    />
  );
}

export default LLMScoreDropdownItem;
