import { decryptUserSecret } from "./userSecretsCrypto";

/**
 * Resolve a `UserSecrets` value: the repo-scoped row if `repoScope` is given
 * and one exists, otherwise the user-global row; `null` if neither exists.
 */
export async function resolveUserSecret(
  context: ResolverContext,
  userId: string,
  repoScope: string | null,
  name: string,
): Promise<string | null> {
  const { UserSecrets } = context;
  if (repoScope) {
    const scoped = await UserSecrets.findOne({ userId, name, repoScope });
    if (scoped) return decryptUserSecret(scoped.encryptedValue);
  }
  const global = await UserSecrets.findOne({ userId, name, repoScope: null });
  return global ? decryptUserSecret(global.encryptedValue) : null;
}
