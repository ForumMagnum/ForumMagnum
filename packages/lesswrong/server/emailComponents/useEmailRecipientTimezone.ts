import { type EmailContextType } from "./emailContext"

export function useEmailRecipientTimezone(emailContext: EmailContextType) {
  const lastUsedTimezone = emailContext.currentUser?.lastUsedTimezone
  if (lastUsedTimezone) {
    return {
      timezone: lastUsedTimezone,
      timezoneIsKnown: true,
    }
  } else {
    return {
      timezoneIsKnown: false,
    }
  }
}
