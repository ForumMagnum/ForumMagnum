import { EmailTokenResult } from "./EmailTokenResult";
import EmailTokenEmailUnsubscribeResult from "./EmailTokenEmailUnsubscribeResult";
import EmailTokenEmailUnsubscribeMarketingResult from "./EmailTokenEmailUnsubscribeMarketingResult";
import EmailTokenEmailUnsubscribeInactiveSummaryResult from "./EmailTokenEmailUnsubscribeInactiveSummaryResult";

export const emailTokenResultComponents = {
  EmailTokenResult,
  EmailTokenEmailUnsubscribeResult,
  EmailTokenEmailUnsubscribeMarketingResult,
  EmailTokenEmailUnsubscribeInactiveSummaryResult,
} as const;

export type EmailTokenResultComponentName = keyof typeof emailTokenResultComponents;
