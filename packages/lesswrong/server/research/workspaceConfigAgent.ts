import { generateText, tool, stepCountIs, Output } from "ai";
import { z } from "zod";
import type { RepoIdentity } from "./repoUrl";
import { fetchRepoFile, fetchRepoTree } from "./githubApi";

/**
 * The workspace-config agent: Claude, driven through the Vercel AI SDK, given
 * read-only tools over the Git host's API. It inspects a repository and infers
 * how to install and run it in a sandbox. The result pre-fills the Create Repo
 * form — a best-effort proposal the user reviews and the first coding
 * conversation verifies for real.
 */

// Routed through the AI gateway, same as `titleGeneration`. Adjust if the
// gateway's model identifier changes.
const CONFIG_AGENT_MODEL = "anthropic/claude-sonnet-4-6";
const CONFIG_AGENT_MAX_STEPS = 16;
const MAX_TREE_ENTRIES = 2000;
const MAX_FILE_CHARS = 20000;

const proposalSchema = z.object({
  runtime: z.enum(["node22", "node24", "node26", "python3.13"]),
  lockfilePath: z.string().describe("Path of the dependency lockfile, relative to the repo root."),
  installCommand: z.string().describe("Concrete install command, any bootstrap folded in."),
  prepareCommand: z.string().nullable().describe("Codegen/migration setup command, or null."),
  devCommand: z.string().nullable().describe("Command that starts the dev server, or null."),
  devPort: z.number().int().nullable().describe("Localhost port the dev server binds to, or null."),
});

export interface WorkspaceRepoConfigProposal {
  defaultBranch: string;
  runtime: string;
  lockfilePath: string;
  installCommand: string;
  prepareCommand: string | null;
  devCommand: string | null;
  devPort: number | null;
}

const SYSTEM_PROMPT = `You configure a code repository so it can be installed and run inside a fresh sandbox.

Use the tools to inspect the repository — list files, read lockfiles and their formats, .yarnrc/.yarnrc.yml, package.json (scripts, packageManager), pyproject.toml/requirements.txt, .env.example, and so on. Then produce the configuration as your final structured response.

Resolve the install command from the lockfile that is present:
- package-lock.json -> npm ci
- pnpm-lock.yaml    -> pnpm install --frozen-lockfile
- yarn.lock         -> version-dependent (see below)
- bun.lock          -> bun install --frozen-lockfile
- requirements.txt  -> pip install -r requirements.txt
- uv.lock           -> uv sync --frozen
- poetry.lock       -> poetry install
- Pipfile.lock      -> pipenv sync

Record the actual lockfile path as lockfilePath, and fold any bootstrap step into installCommand (e.g. "corepack enable && ..." for yarn, "npm i -g bun && ..." for bun).

For yarn the flag depends on the major version: Yarn 1 (classic) uses "yarn install --frozen-lockfile"; Yarn 2+ (Berry) uses "yarn install --immutable". Yarn 1.x is still the most common — do not assume Berry. Inspect the repo for signals (.yarnrc vs .yarnrc.yml, a packageManager field, the yarn.lock header). With no clear signal, use the classic flag.

prepareCommand is for code-derived setup like codegen or migrations — null if there is none. devCommand/devPort describe a dev server — both null if the repo has none.`;

/**
 * Run the config agent against a repo. Returns `null` if the agent never
 * produces a structured response (e.g. it hits the step limit).
 */
export async function inferWorkspaceRepoConfig(
  repo: RepoIdentity,
  defaultBranch: string,
  token: string | null,
): Promise<WorkspaceRepoConfigProposal | null> {
  const result = await generateText({
    model: CONFIG_AGENT_MODEL,
    system: SYSTEM_PROMPT,
    prompt: `Repository: ${repo.host}/${repo.owner}/${repo.name}, branch ${defaultBranch}. Inspect it and produce its workspace configuration.`,
    tools: {
      listFiles: tool({
        description: "List every file path in the repository.",
        inputSchema: z.object({}),
        execute: async () => {
          const paths = await fetchRepoTree(repo, defaultBranch, token);
          return paths.slice(0, MAX_TREE_ENTRIES).join("\n");
        },
      }),
      readFile: tool({
        description: "Read a UTF-8 text file from the repository by its repo-relative path.",
        inputSchema: z.object({ path: z.string() }),
        execute: async ({ path }) => {
          const content = await fetchRepoFile(repo, path, defaultBranch, token);
          return content === null ? `(file not found: ${path})` : content.slice(0, MAX_FILE_CHARS);
        },
      }),
    },
    stopWhen: stepCountIs(CONFIG_AGENT_MAX_STEPS),
    output: Output.object({ schema: proposalSchema }),
  });
  const config = result.output;
  if (!config) return null;
  return { defaultBranch, ...config };
}
