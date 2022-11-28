import { gql, useMutation } from "@apollo/client";
import { useCallback } from "react";

export const useRecordSubforumView = ({userId, tagId}: {userId: string|undefined, tagId: string|undefined}) => {
  const [recordSubforumViewMutation] = useMutation(gql`
    mutation recordSubforumView($userId: String!, $tagId: String!) {
      recordSubforumView(userId: $userId, tagId: $tagId)
    }
  `);
  const recordSubforumView = useCallback(async () => (userId && tagId) ? recordSubforumViewMutation({variables: {userId, tagId}}) : null, [userId, tagId, recordSubforumViewMutation]);

  return recordSubforumView
}
