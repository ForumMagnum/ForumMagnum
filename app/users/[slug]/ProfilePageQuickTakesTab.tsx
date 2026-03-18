import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import { profileStyles, TabPanel } from "./profileStyles";
import { UltraFeedContextProvider } from "@/components/ultraFeed/UltraFeedContextProvider";
import { UltraFeedObserverProvider } from "@/components/ultraFeed/UltraFeedObserver";
import { OverflowNavObserverProvider } from "@/components/ultraFeed/OverflowNavObserverContext";
import UserContentFeed from "@/components/users/UserContentFeed";
import { z } from "zod";

const profilePageQuickTakesTabUnsharedStyles = defineStyles("ProfilePageQuickTakesTabUnshared", () => ({
}));

export const profilePageQuickTakesTabSettingsSchema = z.object({});
export type ProfilePageQuickTakesTabSettings = z.infer<typeof profilePageQuickTakesTabSettingsSchema>;

export const defaultProfilePageQuickTakesTabSettings: ProfilePageQuickTakesTabSettings = {};

export function ProfilePageQuickTakesTabSettingsForm({
  settings,
  onChange,
}: {
  settings: ProfilePageQuickTakesTabSettings,
  onChange: (settings: ProfilePageQuickTakesTabSettings) => void,
}) {
  void settings;
  void onChange;
  return null;
}

export function ProfilePageQuickTakesTabContents({user, settings}: {
  user: UsersProfile,
  settings: ProfilePageQuickTakesTabSettings,
}) {
  void settings;
  const sharedClasses = useStyles(profileStyles);
  const classes = useStyles(profilePageQuickTakesTabUnsharedStyles);

  return (
    <TabPanel>
      <UltraFeedContextProvider openInNewTab={true}>
        <UltraFeedObserverProvider incognitoMode={false}>
          <OverflowNavObserverProvider>
            <div className={sharedClasses.profileFeedTopMargin}>
              <UserContentFeed userId={user._id} externalSortMode="recent" externalFilter="quickTakes" removeSideMargins={true} />
            </div>
          </OverflowNavObserverProvider>
        </UltraFeedObserverProvider>
      </UltraFeedContextProvider>
    </TabPanel>
  );
}
