import { generateText, tool, stepCountIs, Output } from "ai";
import { z } from "zod";
import type { RepoIdentity } from "@/lib/research/repoUrl";
import { fetchRepoFile, fetchRepoTree } from "./githubApi";
import { inspect } from "util";

/**
 * The workspace-config agent: Claude, driven through the Vercel AI SDK, given
 * read-only tools over the Git host's API. It inspects a repository and infers
 * how to install and run it in a sandbox. The result pre-fills the Create Repo
 * form — a best-effort proposal the user reviews and the first coding
 * conversation verifies for real.
 */

const CONFIG_AGENT_MAX_STEPS = 16;
const MAX_TREE_ENTRIES = 2000;
const MAX_FILE_CHARS = 20000;

const proposalSchema = z.object({
  runtime: z.enum(["node22", "node24", "node26", "python3.13"]),
  lockfilePath: z.string().describe("Path of the dependency lockfile, relative to the repo root."),
  installCommand: z.string().describe("Concrete install command, any bootstrap folded in."),
  prepareCommand: z.string().nullable().describe("Setup command needed before devCommand that install doesn't already run (e.g. codegen, migrations). Null if none."),
  devCommand: z.string().nullable().describe("Command that starts the dev server, or null. The sandbox picks the port at runtime — write the command to read it from $PORT (e.g. 'vite --port $PORT', 'python manage.py runserver 0.0.0.0:$PORT')."),
});

export interface WorkspaceRepoConfigProposal {
  defaultBranch: string;
  runtime: string;
  lockfilePath: string;
  installCommand: string;
  prepareCommand: string | null;
  devCommand: string | null;
}

const SYSTEM_PROMPT = `You configure a code repository so it can be installed and run inside a fresh sandbox.

Use the tools to inspect the repository — list files, read README/CONTRIBUTING (especially their "Getting Started" sections), lockfiles and their formats, .yarnrc/.yarnrc.yml, package.json (scripts, packageManager), pyproject.toml/requirements.txt, .env.example, and so on. Then produce the configuration as your final structured response.

The runtime selects the sandbox base image, which fixes the installed language version and the pre-installed package managers — the node images ship with npm and pnpm, and python3.13 ships with pip and uv (yarn, bun, poetry, and pipenv must be bootstrapped via installCommand, as below). For Node repos, pick a version matching what the repo declares (engines.node, .nvmrc, .node-version), defaulting to node24 when nothing is pinned; for Python repos use python3.13 regardless of which minor version the repo asks for, since it is the only Python image available.

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

Before committing to the lockfile-derived command above, check the project's task definitions (package.json "scripts", Makefile, etc.) and README for an "install", "setup", or "bootstrap" task. If one exists and does meaningful extra work beyond running the package manager (e.g. submodule init, fetching binaries, writing config files), fold those steps into installCommand. Note that Node package managers automatically run "postinstall" scripts during install — anything wired up there does NOT need to be duplicated in installCommand or prepareCommand.

prepareCommand handles setup that is required before devCommand can run, but that the install phase does NOT already perform. Look for candidates in whatever task definitions the project uses (package.json "scripts", a Makefile, pyproject.toml tasks, a manage.py, an invoke tasks.py, a justfile, etc.) and in the project's README. Combine multiple steps with && in a single string. Decide as follows:

Include in prepareCommand when the repo needs:
- Code generation that other source files import from (graphql-codegen, protobuf, openapi clients, ORM client generation, "generate"/"codegen" tasks).
- Database migrations the dev server expects to have already been applied (e.g. "alembic upgrade head", "python manage.py migrate", "prisma migrate deploy").
- Building a sibling/workspace package that other packages import at runtime, when install does not build it automatically.

Leave prepareCommand null when:
- The work is already done by install. Many ecosystems run codegen via install-time hooks (Node "postinstall"/"prepare", Python build backends, etc.); if install handles it, do not repeat it.
- The step is a production build, test run, or lint — those are not part of bringing up a dev environment.
- Only optional fixtures or seed data are involved.

When in doubt, prefer null: a missing prepare step surfaces as a clear error on first run, whereas a redundant one wastes time on every sandbox boot.

devCommand starts the repo's dev server — null if the project has no HTTP UI (libraries, CLIs, background services). The canonical invocation is usually already defined in the project's task definitions (package.json "scripts", Makefile, etc.); adapt that command rather than guessing. It must honor the sandbox-provided $PORT env var. Pass $PORT explicitly even when the framework would read PORT on its own, so a framework upgrade cannot silently break the preview. Examples: "next dev --port $PORT", "vite --port $PORT", "python manage.py runserver $PORT", "flask run --port $PORT".`;

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
    model: "openai/gpt-5.5",
    system: SYSTEM_PROMPT,
    prompt: `Repository: ${repo.host}/${repo.owner}/${repo.name}, branch ${defaultBranch}. Inspect it and produce its workspace configuration.`,
    maxOutputTokens: 4096,
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
