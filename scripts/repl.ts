import { detectForumType, getDatabaseConfigFromModeAndForumType, getSettingsFileName, getSettingsFilePath, initGlobals, normalizeModeAlias } from "./scriptUtil";
import { startSshTunnel } from "./startup/buildUtil";
import * as tsNode from 'ts-node';

export async function initRepl() {
  let mode = normalizeModeAlias(process.argv[2]);
  if (mode === "development") {
    mode = "dev";
  } else if (mode === "production") {
    mode = "prod";
  } else {
    mode = "dev";
  }

  const forumType = await detectForumType();
  const forumTypeIsSpecified = forumType !== "none";
  console.log(`Running with forum type "${forumType}"`);

  const dbConf = getDatabaseConfigFromModeAndForumType(mode, forumType);
  if (dbConf.postgresUrl) {
    process.env.PG_URL = dbConf.postgresUrl;
  }
  const args = {
    postgresUrl: process.env.PG_URL,
    settingsFileName: process.env.SETTINGS_FILE || getSettingsFileName(mode, forumType),
    shellMode: false,
  };

  await startSshTunnel(getDatabaseConfigFromModeAndForumType(mode, forumType).sshTunnelCommand);

  if (["dev", "local", "staging", "prod", "xpost"].includes(mode)) {
    console.log('Running REPL in mode', mode);
    args.settingsFileName = getSettingsFilePath(getSettingsFileName(mode, forumType), forumType);
    process.argv = process.argv.slice(0, 3).concat(process.argv.slice(forumTypeIsSpecified ? 5 : 4));
  } else if (args.postgresUrl && args.settingsFileName) {
    console.log('Using PG_URL and SETTINGS_FILE from environment');
  } else {
    throw new Error('Unable to run migration without a mode or environment (PG_URL and SETTINGS_FILE)');
  }

  initGlobals(args, mode==="prod");

  const {initServer} = require("../packages/lesswrong/server/serverStartup");
  await initServer(args);
}

function main() {
  initRepl().then(() => {
    const repl = tsNode.createRepl();
    const service = tsNode.create({...repl.evalAwarePartialHost});
    repl.setService(service);
    repl.start();
  });
}

main();
