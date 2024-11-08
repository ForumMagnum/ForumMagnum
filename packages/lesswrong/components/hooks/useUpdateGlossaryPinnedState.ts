import { useUpdate } from "@/lib/crud/withUpdate";
import { useCurrentUser } from "../common/withUser";
import { useCallback } from "react";
import { useTracking } from "@/lib/analyticsEvents";
import { useCookiesWithConsent } from "./useCookiesWithConsent";

export function useGlossaryPinnedState() {
  const { captureEvent } = useTracking();
  const currentUser = useCurrentUser();
  const [cookies, setCookie] = useCookiesWithConsent(['pinnedGlossary']);

  const { mutate: updateUser } = useUpdate({
    collectionName: "Users",
    fragmentName: 'UsersCurrent',
  });
  
  const togglePin = useCallback(async (source: string) => {
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
    } else {
      const newValue = !cookies.pinnedGlossary;
      captureEvent('toggleGlossaryPin', { newValue, source });
      setCookie('pinnedGlossary', newValue.toString(), { path: '/', expires: new Date('2038-01-19') });
    }
  }, [updateUser, currentUser, captureEvent, cookies, setCookie]);

  const postGlossariesPinned = currentUser?.postGlossariesPinned ?? cookies.pinnedGlossary === 'true';

  return {
    postGlossariesPinned,
    togglePin,
  };
}
