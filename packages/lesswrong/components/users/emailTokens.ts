import { EmailTokenResult } from "./EmailTokenResult";
import type { EmailTokenResultComponentName } from "@/server/emails/emailTokens";

export const emailTokenResultComponents = {
  EmailTokenResult,
} satisfies Record<EmailTokenResultComponentName, React.ComponentType<any>>;
