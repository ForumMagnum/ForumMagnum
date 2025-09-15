import { EmailTokenResult } from "./EmailTokenResult";
import EmailTokenEmailUnsubscribeResult from "./EmailTokenEmailUnsubscribeResult";
import EmailTokenEmailUnsubscribeMarketingResult from "./EmailTokenEmailUnsubscribeMarketingResult";

export const emailTokenResultComponents = {
  EmailTokenResult,
  EmailTokenEmailUnsubscribeResult,
  EmailTokenEmailUnsubscribeMarketingResult,
} as const;

export type EmailTokenResultComponentName = keyof typeof emailTokenResultComponents;
