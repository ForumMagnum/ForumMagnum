import { useUpdate } from "@/lib/crud/withUpdate";
import { useCurrentUser } from "../common/withUser";
import { useCallback } from "react";
import { useTracking } from "@/lib/analyticsEvents";

export function useGlossaryPinnedState() {
  const { captureEvent } = useTracking();
  const currentUser = useCurrentUser();
  const {mutate: updateUser} = useUpdate({
    collectionName: "Users",
    fragmentName: 'UsersCurrent',
  });
  
  const togglePin = useCallback(async (source: string) => {
    // TODO: figure out what to do for logged out users... should it just be local state individualized by post, or pop up a login modal?
    if (currentUser) {
      captureEvent('toggleGlossaryPin', { newValue: !currentUser.postGlossariesPinned, source });
      return await updateUser({
        selector: { _id: currentUser._id },
        data: { postGlossariesPinned: !currentUser.postGlossariesPinned },
        optimisticResponse: {
          ...currentUser,
          postGlossariesPinned: !currentUser.postGlossariesPinned,
        },
      });
    }
  }, [updateUser, currentUser, captureEvent]);

  return {
    postGlossariesPinned: currentUser?.postGlossariesPinned,
    togglePin,
  };
}
