import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import { profileStyles } from "./profileStyles";
import { UltraFeedContextProvider } from "@/components/ultraFeed/UltraFeedContextProvider";
import { UltraFeedObserverProvider } from "@/components/ultraFeed/UltraFeedObserver";
import { OverflowNavObserverProvider } from "@/components/ultraFeed/OverflowNavObserverContext";
import UserContentFeed from "@/components/users/UserContentFeed";
import { z } from "zod";

const profilePageQuickTakesTabUnsharedStyles = defineStyles("ProfilePageQuickTakesTabUnshared", () => ({
  tabPanel: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    animation: "$slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    "@media (max-width: 630px)": {
      order: 1,
    },
  },
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
    <div className={classes.tabPanel}>
      <UltraFeedContextProvider openInNewTab={true}>
        <UltraFeedObserverProvider incognitoMode={false}>
          <OverflowNavObserverProvider>
            <div className={sharedClasses.profileFeedTopMargin}>
              <UserContentFeed userId={user._id} externalSortMode="recent" externalFilter="quickTakes" removeSideMargins={true} />
            </div>
          </OverflowNavObserverProvider>
        </UltraFeedObserverProvider>
      </UltraFeedContextProvider>
    </div>
  );
}