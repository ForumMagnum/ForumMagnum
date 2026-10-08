import { z } from "zod";
import type { RepoIdentity } from "@/lib/research/repoUrl";

/**
 * Minimal read-only GitHub REST client — just what the workspace-config agent
 * needs to inspect a repository (default branch, file tree, file contents).
 * Plain `fetch`; no SDK dependency.
 */

const GITHUB_API = "https://api.github.com";

function githubHeaders(token: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "ForumMagnum-research-workspace",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function githubGet(path: string, token: string | null): Promise<Response> {
  return fetch(`${GITHUB_API}${path}`, { headers: githubHeaders(token) });
}

const repoResponseSchema = z.object({ default_branch: z.string() });
const treeEntrySchema = z.object({ path: z.string(), type: z.string() });
const treeResponseSchema = z.object({ tree: z.array(treeEntrySchema) });
const fileResponseSchema = z.object({ content: z.string() });

/** The repo's default branch. */
export async function fetchRepoDefaultBranch(
  repo: RepoIdentity,
  token: string | null,
): Promise<string> {
  if (repo.host !== "github.com") {
    throw new Error(`Only github.com repositories are supported (got ${repo.host}).`);
  }
  const res = await githubGet(`/repos/${repo.owner}/${repo.name}`, token);
  if (!res.ok) {
    throw new Error(`GitHub repo lookup failed (${res.status}) for ${repo.owner}/${repo.name}`);
  }
  return repoResponseSchema.parse(await res.json()).default_branch;
}

/** Every file path in the repo at `ref` (directories excluded). */
export async function fetchRepoTree(
  repo: RepoIdentity,
  ref: string,
  token: string | null,
): Promise<string[]> {
  if (repo.host !== "github.com") {
    throw new Error(`Only github.com repositories are supported (got ${repo.host}).`);
  }
  const res = await githubGet(
    `/repos/${repo.owner}/${repo.name}/git/trees/${encodeURIComponent(ref)}?recursive=1`,
    token,
  );
  if (!res.ok) {
    throw new Error(`GitHub tree lookup failed (${res.status}) for ${repo.owner}/${repo.name}@${ref}`);
  }
  return treeResponseSchema
    .parse(await res.json())
    .tree
    .filter((entry) => entry.type === "blob")
    .map((entry) => entry.path);
}

/** A UTF-8 text file's contents, or `null` if the path does not exist. */
export async function fetchRepoFile(
  repo: RepoIdentity,
  path: string,
  ref: string,
  token: string | null,
): Promise<string | null> {
  if (repo.host !== "github.com") {
    throw new Error(`Only github.com repositories are supported (got ${repo.host}).`);
  }
  const cleanPath = path.replace(/^\/+/, "");
  const res = await githubGet(
    `/repos/${repo.owner}/${repo.name}/contents/${cleanPath}?ref=${encodeURIComponent(ref)}`,
    token,
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`GitHub file lookup failed (${res.status}) for ${cleanPath}`);
  }
  const parsed = fileResponseSchema.safeParse(await res.json());
  if (!parsed.success) return null;
  return Buffer.from(parsed.data.content, "base64").toString("utf8");
}
