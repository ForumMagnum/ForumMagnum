import { runMailgunValidationsBatch } from "@/server/mailgun/mailgunValidations";
import { loggerConstructor } from "@/lib/utils/logging";

/**
 * Run Mailgun validations repeatedly until the queue is empty.
 *
 * Intended usage:
 * - via `yarn repl` (call `runMailgunValidationsUntilDone()`)
 * - or imported into a one-off admin script
 */
export async function runMailgunValidationsUntilDone(args?: {
  batchSize?: number;
  mailboxVerification?: boolean;
  concurrency?: number;
  maxBatches?: number;
}) {
  const logger = loggerConstructor("script-runMailgunValidationsUntilDone");

  const maxBatches = args?.maxBatches ?? 10_000;
  for (let i = 0; i < maxBatches; i += 1) {
    const { processed, succeeded, failed } = await runMailgunValidationsBatch({
      limit: args?.batchSize,
      concurrency: args?.concurrency,
    });

    logger(`batch=${i + 1} processed=${processed} succeeded=${succeeded} failed=${failed}`);
    if (processed === 0) {
      return;
    }
  }

  logger(`Stopped after maxBatches=${maxBatches}`);
}


