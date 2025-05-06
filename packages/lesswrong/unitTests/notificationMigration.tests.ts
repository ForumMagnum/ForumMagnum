import { isLegacyNotificationTypeSettings, isNewNotificationTypeSettings, LegacyNotificationTypeSettings, legacyToNewNotificationTypeSettings, newToLegacyNotificationTypeSettings } from "@/lib/collections/users/notificationFieldHelpers";

describe("NotificationTypeSettings migration", () => {
  const channels = ["none", "onsite", "email", "both"] as const;
  const batchingFrequencies = ["realtime", "daily", "weekly"] as const;
  const timeOfDayGMTs = [...Array(24).keys()];
  const dayOfWeekGMTs = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

  it(`should be that newToLegacyNotificationTypeSettings and legacyToNewNotificationTypeSettings are inverses of each other`, () => {
    // 4 * 3 * 24 * 7 === 2016 combinations
    for (const channel of channels) {
      for (const batchingFrequency of batchingFrequencies) {
        for (const timeOfDayGMT of timeOfDayGMTs) {
          for (const dayOfWeekGMT of dayOfWeekGMTs) {
            const legacySetting: LegacyNotificationTypeSettings = {
              channel,
              batchingFrequency,
              timeOfDayGMT,
              dayOfWeekGMT
            };

            const newFormat = legacyToNewNotificationTypeSettings(legacySetting);
            const convertedBack = newToLegacyNotificationTypeSettings(newFormat);
            expect(convertedBack).toEqual(legacySetting);
            expect(isNewNotificationTypeSettings(newFormat)).toBeTruthy();
            expect(isLegacyNotificationTypeSettings(convertedBack)).toBeTruthy();
          }
        }
      }
    }
  });
});
