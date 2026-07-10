/**
 * Normalize a user-supplied repository URL into a stable `(host, owner, name)`
 * identity.
 */
export interface RepoIdentity {
  host: string;
  owner: string;
  name: string;
}

export function parseRepoUrl(rawUrl: string): RepoIdentity {
  const trimmed = rawUrl.trim();

  // `git@host:owner/name(.git)`
  const sshMatch = /^git@([^:]+):([^/]+)\/(.+?)(?:\.git)?\/?$/.exec(trimmed);
  if (sshMatch) {
    return { host: sshMatch[1].toLowerCase(), owner: sshMatch[2], name: sshMatch[3] };
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error(`Not a valid repository URL: ${rawUrl}`);
  }
  const segments = url.pathname.replace(/^\/+/, "").split("/");
  if (segments.length < 2 || !segments[0] || !segments[1]) {
    throw new Error(`Repository URL must be of the form https://host/owner/name: ${rawUrl}`);
  }
  return {
    host: url.host.toLowerCase(),
    owner: segments[0],
    name: segments[1].replace(/\.git$/, ""),
  };
}

/** The `host/owner/name` string used as a `UserSecrets.repoScope`. */
export function repoScopeOf(identity: RepoIdentity): string {
  return `${identity.host}/${identity.owner}/${identity.name}`;
}
