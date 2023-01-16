import { useCallback, useRef } from "react";
import { useCreate } from "../../lib/crud/withCreate";
import { useMulti } from "../../lib/crud/withMulti";

/**
 * get-or-create wrapper for UserTagRel
 */
export const useUserTagRel = ({userId, tagId}: {userId: string|undefined, tagId: string|undefined}): {userTagRel?: UserTagRelDetails, loading: boolean, refetch: any} => {
  const { results, loading: fetchLoading, refetch } = useMulti({
    terms: { view: "single", tagId, userId },
    collectionName: "UserTagRels",
    fragmentName: "UserTagRelDetails",
  });
  
  const { create, loading: createLoading } = useCreate({
    collectionName: "UserTagRels",
    fragmentName: "UserTagRelDetails",
  });
  const createInflight = useRef(false);

  const createUserTagRel = useCallback(async () => {
    await create({ data: {userId: userId, tagId: tagId}})
    createInflight.current = false;
    refetch()
  }, [create, refetch, tagId, userId])

  if (!userId || !tagId) {
    return {userTagRel: undefined, loading: false, refetch: () => {}}
  }

  if (results !== undefined && results.length == 0 && !createInflight.current) {
    createInflight.current = true; // Prevent (rare) race condition where multiple calls to createUserTagRel() are made
    void createUserTagRel()
  }

  return {userTagRel: results?.[0], loading: fetchLoading, refetch}
}


