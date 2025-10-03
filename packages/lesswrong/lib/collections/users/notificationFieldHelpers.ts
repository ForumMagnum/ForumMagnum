import { TupleSet, UnionOf } from "@/lib/utils/typeGuardUtils";
import SimpleSchema from "@/lib/utils/simpleSchema";

///////////////////////////////////////////////
// Migration of NotificationTypeSettings     //
//                                           //
// This section is here to support migrating //
// NotificationTypeSettings to a new format, //
// and will be deleted shortly               //
///////////////////////////////////////////////


export type LegacyNotificationTypeSettings = {
  channel: "none" | "onsite" | "email" | "both";
  batchingFrequency: "realtime" | "daily" | "weekly";
  timeOfDayGMT: number; // 0 to 23
  dayOfWeekGMT: DayOfWeek;
};


export const legacyDefaultNotificationTypeSettings: LegacyNotificationTypeSettings = {
  channel: "onsite",
  batchingFrequency: "realtime",
  timeOfDayGMT: 12,
  dayOfWeekGMT: "Monday",
};

const legacyBothChannelNotificationTypeSettings: LegacyNotificationTypeSettings = {
  channel: "both",
  batchingFrequency: "realtime",
  timeOfDayGMT: 12,
  dayOfWeekGMT: "Monday",
};

export const defaultNotificationTypeSettings: NotificationTypeSettings = {
  onsite: {
    enabled: true,
    batchingFrequency: "realtime",
    timeOfDayGMT: 12,
    dayOfWeekGMT: "Monday",
  },
  email: {
    enabled: false,
    batchingFrequency: "realtime",
    timeOfDayGMT: 12,
    dayOfWeekGMT: "Monday",
  }
};

export const bothChannelsEnabledNotificationTypeSettings: NotificationTypeSettings = {
  onsite: {
    enabled: true,
    batchingFrequency: "realtime",
    timeOfDayGMT: 12,
    dayOfWeekGMT: "Monday",
  },
  email: {
    enabled: true,
    batchingFrequency: "realtime",
    timeOfDayGMT: 12,
    dayOfWeekGMT: "Monday",
  }
};

export function isNewNotificationTypeSettings(value: AnyBecauseIsInput): value is NotificationTypeSettings {
  return (
    typeof value === 'object' &&
    value !== null &&
    'onsite' in value &&
    'email' in value &&
    typeof value.onsite === 'object' &&
    typeof value.email === 'object' &&
    'batchingFrequency' in value.onsite &&
    'timeOfDayGMT' in value.onsite &&
    'dayOfWeekGMT' in value.onsite
  );
}

export function legacyToNewNotificationTypeSettings(notificationSettings: LegacyNotificationTypeSettings | NotificationTypeSettings | null): NotificationTypeSettings {
  if (!notificationSettings) return defaultNotificationTypeSettings;
  if (isNewNotificationTypeSettings(notificationSettings)) return notificationSettings;

  const { channel, batchingFrequency, timeOfDayGMT, dayOfWeekGMT } = notificationSettings;

  const onsiteEnabled = (channel === "both" || channel === "onsite");
  const emailEnabled = (channel === "both" || channel === "email");

  return {
    onsite: {
      enabled: onsiteEnabled,
      batchingFrequency,
      timeOfDayGMT,
      dayOfWeekGMT,
    },
    email: {
      enabled: emailEnabled,
      batchingFrequency,
      timeOfDayGMT,
      dayOfWeekGMT,
    },
  };
}
;

export function isLegacyNotificationTypeSettings(value: AnyBecauseIsInput): value is LegacyNotificationTypeSettings {
  return (
    typeof value === 'object' &&
    value !== null &&
    'channel' in value &&
    'batchingFrequency' in value &&
    'timeOfDayGMT' in value &&
    'dayOfWeekGMT' in value
  );
}

export function newToLegacyNotificationTypeSettings(newFormat: LegacyNotificationTypeSettings | NotificationTypeSettings | null): LegacyNotificationTypeSettings {
  if (!newFormat) return legacyDefaultNotificationTypeSettings;
  if (isLegacyNotificationTypeSettings(newFormat)) return newFormat;

  const { onsite, email } = newFormat;

  let channel: "none" | "onsite" | "email" | "both" = "none";
  if (onsite.enabled && email.enabled) {
    channel = "both";
  } else if (onsite.enabled) {
    channel = "onsite";
  } else if (email.enabled) {
    channel = "email";
  }

  // Not a one-to-one mapping here because the old format doesn't support different settings for each channel
  // when both are enabled. If this is the case, choose the faster frequency for both
  let batchingFrequency: NotificationBatchingFrequency = legacyDefaultNotificationTypeSettings.batchingFrequency;
  if (channel === "both") {
    const frequencies = [onsite.batchingFrequency, email.batchingFrequency];
    if (frequencies.includes("realtime")) {
      batchingFrequency = "realtime";
    } else if (frequencies.includes("daily")) {
      batchingFrequency = "daily";
    } else {
      batchingFrequency = "weekly";
    }
  } else {
    batchingFrequency = channel === "onsite" ? onsite.batchingFrequency : email.batchingFrequency;
  }

  // Use onsite settings as the default for time and day, assuming they are the same for both
  return {
    channel,
    batchingFrequency,
    timeOfDayGMT: onsite.timeOfDayGMT,
    dayOfWeekGMT: onsite.dayOfWeekGMT,
  };
}

export const dailyEmailBatchNotificationSettingOnCreate = {
  onsite: defaultNotificationTypeSettings.onsite,
  email: { ...defaultNotificationTypeSettings.email, enabled: true, batchingFrequency: "daily" },
};

export const emailEnabledNotificationSettingOnCreate = {
  onsite: defaultNotificationTypeSettings.onsite,
  email: { ...defaultNotificationTypeSettings.email, enabled: true },
};

export type NotificationChannel = "onsite" | "email";

const NOTIFICATION_BATCHING_FREQUENCIES = new TupleSet([
  "realtime",
  "daily",
  "weekly",
] as const);
export type NotificationBatchingFrequency = UnionOf<typeof NOTIFICATION_BATCHING_FREQUENCIES>;

const DAYS_OF_WEEK = new TupleSet(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const);
export type DayOfWeek = UnionOf<typeof DAYS_OF_WEEK>;

export type NotificationChannelSettings = {
  enabled: boolean;
  /**
   * Frequency at which we send batched notifications. When enabled is false, this doesn't apply, but is persisted
   * so the user can restore their old settings
   */
  batchingFrequency: NotificationBatchingFrequency;
  /** Time of day at which daily/weekly batched updates are released. A number of hours [0,24), always in GMT. */
  timeOfDayGMT: number;
  /** Day of week at which weekly updates are released, always in GMT */
  dayOfWeekGMT: DayOfWeek;
};

const notificationChannelSettingsSchema = new SimpleSchema({
  enabled: {
    type: Boolean,
  },
  batchingFrequency: {
    type: String,
    allowedValues: Array.from(NOTIFICATION_BATCHING_FREQUENCIES),
  },
  timeOfDayGMT: {
    type: SimpleSchema.Integer,
    min: 0,
    max: 23
  },
  dayOfWeekGMT: {
    type: String,
    allowedValues: Array.from(DAYS_OF_WEEK)
  },
});

export type NotificationTypeSettings = Record<NotificationChannel, NotificationChannelSettings>;

export const notificationTypeSettingsSchema = new SimpleSchema({
  onsite: {
    type: notificationChannelSettingsSchema,
  },
  email: {
    type: notificationChannelSettingsSchema,
  },
});

