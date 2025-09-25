import { exec as execCb } from "child_process";
import { promisify } from "util";
import { detectForumType, EnvironmentType, ForumType, isCodegen, isEnvironmentType, isForumType } from "./scriptUtil"
import { loadEnvConfig } from "@next/env";
import { TupleSet } from "@/lib/utils/typeGuardUtils";

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
  if (detectedForumType === "none") {
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

  if (!isForumType(providedForumType) || providedForumType === "none") {
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
        if (isForumType(arg) && arg !== "none") {
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

function parseInstanceCommandLine() {
  const args = process.argv.slice(2);

  const [env, providedForumType] = args;

  if (!env || !isEnvironmentType(env)) {
    // eslint-disable-next-line no-console
    console.error("Please specify an environment (dev, prod, local, etc)");
    process.exit(1);
  }

  if (!isForumType(providedForumType) || providedForumType === "none") {
    // eslint-disable-next-line no-console
    console.error("Please specify a valid forum type (lw, ea, af)");
    process.exit(1);
  }

  const forumType = providedForumType ?? detectDefaultForumType();

  return {
    environment: env,
    forumType,
  } as const;
}

function getVercelEnvName(environment: EnvironmentType, codegen?: boolean) {
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

async function loadAndValidateEnv(environment: EnvironmentType, codegen?: boolean) {
  const vercelEnvName = getVercelEnvName(environment, codegen);
  const settingsFileName = `.env.local`;
  try {
    await exec(`vercel env pull ${settingsFileName} --yes --environment=${vercelEnvName}`);
  } catch (e) {
    throw new Error(`Failed to pull Vercel environment "${vercelEnvName}" with error: ${e}`);
  }

  const useDevSettings = environment === "dev";
  
  loadEnvConfig(process.cwd(), useDevSettings);

  const envName = process.env.ENV_NAME;

  if (!envName) {
    throw new Error("ENV_NAME is not set when loading .env config(s)");
  }

  if (!envName.toLowerCase().includes(environment) && (environment === 'test' && !envName.toLowerCase().includes('dev'))) {
    throw new Error(`Tried to run in environment "${environment}" but ENV_NAME is "${process.env.ENV_NAME}", which doesn't correspond to that environment`);
  }
}

export async function loadReplEnv() {
  const commandLineOptions = parseReplCommandLine();
  await loadAndValidateEnv(commandLineOptions.environment);
  return commandLineOptions;
}

export async function loadMigrateEnv() {
  const migrateOptions = parseMigrateCommandLine();
  await loadAndValidateEnv(migrateOptions.environment);
  return migrateOptions;
}

export async function loadInstanceEnv() {
  const commandLineOptions = parseInstanceCommandLine();
  await loadAndValidateEnv(commandLineOptions.environment);
  return commandLineOptions;
}
