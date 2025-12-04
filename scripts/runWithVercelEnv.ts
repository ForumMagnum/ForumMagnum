import { exec as execCb } from "child_process";
import { promisify } from "util";
import { loadEnvConfig } from "@next/env";
import { TupleSet } from "@/lib/utils/typeGuardUtils";
import { detectForumType, EnvironmentType, ForumType, isCodegen, isEnvironmentType, isForumType } from "./scriptUtil"
import fs from "fs/promises";

const exec = promisify(execCb);

interface CommandLineOptions {
  environment: EnvironmentType|null
  forumType: Exclude<ForumType, "none">|null
  codegen: boolean|null
  file: string|null
  command: string|null
}

export interface ProjectEnv extends CommandLineOptions {
  environment: 'dev' | 'prod'
  forumType: Exclude<ForumType, "none">
}

function printReplHelpText() {
  // eslint-disable-next-line no-console
  console.log(
`Usage: yarn repl [mode] [forum-type]
Or: yarn repl [mode] [forum-type] [filename] [js]

[mode] is "dev", "prod", "local", etc.
[forum-type] is "lw", "ea", or "af" (optional).

Examples:
  To make a REPL connecting to the LW dev DB:
    yarn repl dev lw
  To run exampleFunction from packages/lesswrong/server/scripts/example.ts:
    yarn repl dev lw packages/lesswrong/server/scripts/example.ts 'exampleFunction()'
  To run a function which is the default export from packages/lesswrong/server/scripts/example.ts:
    yarn repl dev lw packages/lesswrong/server/scripts/example.ts 'exampleFunction()'
`);
}

function detectDefaultForumType() {
  const detectedForumType = detectForumType();
  if (detectedForumType === null) {
    // eslint-disable-next-line no-console
    console.error("Please specify a forum type (lw, ea, af)");
    process.exit(1);
  }
  return detectedForumType;
}

const validMigrateCommands = new TupleSet(["up", "down", "pending", "executed", "create"] as const);

function parseMigrateCommandLine() {
  const args = process.argv.slice(2);
  
  const command = args.shift();
  if (!command || !validMigrateCommands.has(command)) {
    // eslint-disable-next-line no-console
    console.error("Please specify a valid migrate command (up, down, pending, executed, create)");
    process.exit(1);
  }

  const [nameOrEnv, providedForumType] = args;

  if (command === "create") {
    if (!nameOrEnv) {
      // eslint-disable-next-line no-console
      console.error("Please specify a name for the new migration");
      process.exit(1);
    }

    return {
      command,
      name: nameOrEnv,
      environment: 'dev',
      forumType: detectDefaultForumType(),
    } as const;
  }

  if (!nameOrEnv || !isEnvironmentType(nameOrEnv)) {
    // eslint-disable-next-line no-console
    console.error("Please specify an environment (dev, prod, local, etc)");
    process.exit(1);
  }

  if (!isForumType(providedForumType)) {
    // eslint-disable-next-line no-console
    console.error("Please specify a valid forum type (lw, ea, af)");
    process.exit(1);
  }

  const forumType = providedForumType ?? detectDefaultForumType();

  return {
    command,
    environment: nameOrEnv,
    forumType,
  } as const;
}

function parseReplCommandLine() {
  const argv = process.argv.slice(2);

  const result: CommandLineOptions = {
    environment: null,
    forumType: null,
    codegen: null,
    file: null,
    command: null,
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch(arg) {
      case "-h": case "-help": case "--help": case "/?":
        printReplHelpText();
        process.exit(0);
        break;
      default:
        if (isForumType(arg)) {
          result.forumType = arg;
        } else if (isEnvironmentType(arg)) {
          result.environment = arg;
        } else if (isCodegen(arg)) {
          result.codegen = true;
        } else {
          if (!result.file) {
            result.file = arg;
          } else if (!result.command) {
            result.command = arg;
          } else {
            // eslint-disable-next-line no-console
            console.error("Too many positional arguments");
            process.exit(1);
          }
        }
        break;
    }
  }

  if (!result.environment) {
    // eslint-disable-next-line no-console
    console.error("Please specify an environment (dev, prod, local, etc)");
    process.exit(1);
  }

  if (!result.forumType) {
    result.forumType = detectDefaultForumType();
  }
  
  return result as ProjectEnv;
}

function parseCkEditorUploadCommandLine() {
  const args = process.argv.slice(2);

  const [firstArg, secondArg] = args;

  if (!firstArg) {
    return {
      environment: "dev",
      forumType: detectDefaultForumType(),
    } as const;
  } else if (!secondArg) {
    if (!isEnvironmentType(firstArg) && !isForumType(firstArg)) {
      // eslint-disable-next-line no-console
      console.error(`Invalid argument: ${firstArg}, should be either an environment or a forum type (if you want the dev db, just specify the forum type)`);
      process.exit(1);
    } else if (isEnvironmentType(firstArg)) {
      return {
        environment: firstArg,
        forumType: detectDefaultForumType(),
      } as const;
    } else {
      return {
        environment: "dev",
        forumType: firstArg,
      } as const;
    }
  } else {
    if (!isEnvironmentType(firstArg) || !isForumType(secondArg)) {
      // eslint-disable-next-line no-console
      console.error(`Invalid combination of arguments: ${firstArg} and ${secondArg}, should be an environment, then a forum type (i.e "yarn start prod af")`);
      process.exit(1);
    } else {
      return {
        environment: firstArg,
        forumType: secondArg,
      } as const;
    }
  }
}

function getVercelEnvName(environment: EnvironmentType, codegen: boolean) {
  switch (environment) {
    case "dev":
      return "development";
    case "prod":
      return "production";
    case "test":
      if (codegen) {
        return "development";
      } else {
        throw new Error("Test environment not yet supported for Vercel");
      }
    case "local":
    case "staging":
    case "xpost":
      throw new Error("Environment not yet supported for Vercel");
  }
}

interface LoadEnvOptions {
  environment: EnvironmentType;
  forumType: Exclude<ForumType, "none">;
  codegen?: boolean | null;
}

export function getForumTypeEnv(forumType: Exclude<ForumType, "none">) {
  switch (forumType) {
    case 'lw':
      return 'LessWrong';
    case 'af':
      return 'AlignmentForum';
    case 'ea':
      return 'EAForum';
  }
}

async function loadAndValidateEnv({ environment, forumType, codegen }: LoadEnvOptions) {
  // In a Github Actions context, we run `vercel env pull` in an action step
  // and we'd need to pass in `--token` to run it here instead, which would
  // require exposing the secrets in an annoying way.
  if (!process.env.SKIP_VERCEL_CODE_PULL) {
    const vercelEnvName = getVercelEnvName(environment, !!codegen);
    const settingsFileName = `.env.local`;
    const tempFileName = '.env.temp';

    try {
      // Download settings to a temp file, then replace .env.local with it if
      // they're different. This avoids "changing" the settings file when it
      // isn't actually changed, which would cause any development servers
      // watching that file to force-refresh everything.
      // Ignore changes to VERCEL_OIDC_TOKEN because it's regenerated on every
      // pull, and we don't actually use it.
      await exec(`vercel env pull ${tempFileName} --yes --environment=${vercelEnvName}`);
      if (await envFileContentsDiffer(settingsFileName, tempFileName, {
        ignoredEnvKeys: ["VERCEL_OIDC_TOKEN"]
      })) {
        await fs.rename(tempFileName, settingsFileName);
      } else {
        await fs.unlink(tempFileName);
      }
    } catch (e) {
      try {
        await fs.unlink(tempFileName);
      } catch {}
      throw new Error(`Failed to pull Vercel environment "${vercelEnvName}" with error: ${e}`);
    }
  }

  const useDevSettings = environment === "dev";
  
  loadEnvConfig(process.cwd(), useDevSettings);
  process.env.FORUM_TYPE = getForumTypeEnv(forumType);

  const envName = process.env.ENV_NAME;

  if (!envName) {
    throw new Error("ENV_NAME is not set when loading .env config(s)");
  }

  if (!envName.toLowerCase().includes(environment) && (environment === 'test' && !envName.toLowerCase().includes('dev'))) {
    throw new Error(`Tried to run in environment "${environment}" but ENV_NAME is "${process.env.ENV_NAME}", which doesn't correspond to that environment`);
  }
}

async function envFileContentsDiffer(pathOne: string, pathTwo: string, options: {ignoredEnvKeys: string[]}): Promise<boolean> {
  try {
    const [contentsOne, contentsTwo] = await Promise.all([
      fs.readFile(pathOne, "utf-8"),
      fs.readFile(pathTwo, "utf-8")
    ]);
    const isIgnoredLine = (line: string) => options.ignoredEnvKeys.some(key => line.startsWith(key));
    const filteredContentsOne = contentsOne.split('\n').filter(line => !isIgnoredLine(line));
    const filteredContentsTwo = contentsTwo.split('\n').filter(line => !isIgnoredLine(line));
    return filteredContentsOne.join("\n") !== filteredContentsTwo.join("\n");
  } catch {
    // If either file fails to read, treat that as differing
    return true;
  }
}

export async function loadReplEnv() {
  const commandLineOptions = parseReplCommandLine();
  await loadAndValidateEnv(commandLineOptions);
  return commandLineOptions;
}

export async function loadMigrateEnv() {
  const migrateOptions = parseMigrateCommandLine();
  await loadAndValidateEnv(migrateOptions);
  return migrateOptions;
}

export async function loadCkEditorUploadEnv() {
  const instanceOptions = parseCkEditorUploadCommandLine();
  await loadAndValidateEnv(instanceOptions);
  return instanceOptions;
}
