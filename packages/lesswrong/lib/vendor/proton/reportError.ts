import { captureException } from "@/lib/sentryWrapper";

export const reportError = (error: unknown): void => {
  // eslint-disable-next-line no-console
  console.error('[suggested-edits]', error);
  captureException(error);
};
