// import { gql, useMutation } from "@apollo/client";
// import { useCallback } from "react";

// DEPRECATED: We didn't actually use the timestamp inserted by this mutation. Plus we have changed from assuming this will be called first to create the UserTagRel,
// to using `createIfMissing`. We probably do want to record subforum views in the future but this will need to be rearchitected.
// export const useRecordSubforumView = ({userId, tagId}: {userId: string|undefined, tagId: string|undefined}) => {
//   const [recordSubforumViewMutation] = useMutation(gql`
//     mutation recordSubforumView($userId: String!, $tagId: String!) {
//       recordSubforumView(userId: $userId, tagId: $tagId)
//     }
//   `);
//   const recordSubforumView = useCallback(async () => (userId && tagId) ? recordSubforumViewMutation({variables: {userId, tagId}}) : null, [userId, tagId, recordSubforumViewMutation]);

//   return recordSubforumView
// }
