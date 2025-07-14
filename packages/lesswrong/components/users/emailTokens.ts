import { EmailTokenResult } from "./EmailTokenResult";
import EmailTokenEmailUnsubscribeResult from "./EmailTokenEmailUnsubscribeResult";
import type { EmailTokenResultComponentName } from "@/server/emails/emailTokens";

export const emailTokenResultComponents = {
  EmailTokenResult,
  EmailTokenEmailUnsubscribeResult,
} satisfies Record<EmailTokenResultComponentName, React.ComponentType<any>>;
