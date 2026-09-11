import { CombinedGraphQLErrors } from '@apollo/client';

/**
 * True for the transient "sandbox still starting" rejection a research mutation
 * throws while a sandbox is resuming. The resume keeps progressing server-side,
 * so the prompt is preserved and a retry succeeds — this is a "try again in a
 * moment", not a real failure.
 */
export function isSandboxWarmingError(err: unknown): boolean {
  return (
    err instanceof CombinedGraphQLErrors &&
    err.errors.some((e) => e.extensions?.code === 'SANDBOX_WARMING')
  );
}

const WARMING_RETRY_MS = 3000;
const WARMING_DEADLINE_MS = 3 * 60 * 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retryWhileSandboxWarming<T>(
  attempt: () => Promise<T>,
  isCancelled: () => boolean = () => false,
): Promise<T | null> {
  const deadline = Date.now() + WARMING_DEADLINE_MS;
  for (;;) {
    if (isCancelled()) return null;
    try {
      const result = await attempt();
      return isCancelled() ? null : result;
    } catch (err) {
      if (isCancelled()) return null;
      if (!isSandboxWarmingError(err) || Date.now() >= deadline) throw err;
      await sleep(WARMING_RETRY_MS);
    }
  }
}
