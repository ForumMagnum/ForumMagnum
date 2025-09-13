// eslint-disable-next-line no-restricted-imports
import * as Sentry from '@sentry/nextjs';
// eslint-disable-next-line no-restricted-imports
import type { Scope } from '@sentry/nextjs';

export function getSentry(): typeof Sentry | null {
  return Sentry;
}

export const captureException = Sentry.captureException;

// eslint-disable-next-line no-barrel-files/no-barrel-files
export type { Scope };
