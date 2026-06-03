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
