import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import { profileStyles } from "./profileStyles";
import { UltraFeedContextProvider } from "@/components/ultraFeed/UltraFeedContextProvider";
import { UltraFeedObserverProvider } from "@/components/ultraFeed/UltraFeedObserver";
import { OverflowNavObserverProvider } from "@/components/ultraFeed/OverflowNavObserverContext";
import UserContentFeed from "@/components/users/UserContentFeed";

export function ProfilePageQuickTakesTab({user}: {
  user: UsersProfile,
}) {
  const classes = useStyles(profileStyles);

  return (
    <UltraFeedContextProvider openInNewTab={true}>
      <UltraFeedObserverProvider incognitoMode={false}>
        <OverflowNavObserverProvider>
          <div className={classes.profileFeedTopMargin}>
            <UserContentFeed userId={user._id} externalSortMode="recent" externalFilter="quickTakes" removeSideMargins={true} />
          </div>
        </OverflowNavObserverProvider>
      </UltraFeedObserverProvider>
    </UltraFeedContextProvider>
  );
}