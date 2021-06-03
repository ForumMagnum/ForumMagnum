import { isAnyTest } from '../lib/executionEnvironment';
import process from 'process';
import fs from 'fs';

interface CommandLineArguments {
  mongoUrl: string
  postgresUrl: string
  settingsFileName: string
  shellMode: boolean,
}

const parseCommandLine = (argv: Array<string>): CommandLineArguments => {
  const commandLine: CommandLineArguments = {
    mongoUrl: process.env.MONGO_URL || "mongodb://localhost:27017",
    postgresUrl: process.env.PG_URL || "postgres://lesswrong@localhost/lesswrong",
    settingsFileName: "settings.json",
    shellMode: false,
  }
  
  // Don't parse command-line arguments during unit testing (because jest passes
  // its command line arguments through).
  if (isAnyTest)
    return commandLine;
  
  for (let i=2; i<argv.length; i++) {
    const arg = argv[i];
    switch(arg) {
      case "--settings":
        commandLine.settingsFileName = argv[++i];
        break;
      case "--shell":
        commandLine.shellMode = true;
        break;
      default:
        throw new Error(`Unrecognized command line argument: ${arg}`);
    }
  }
  
  return commandLine;
}

export const getCommandLineArguments = () => {
  return parseCommandLine(process.argv);
}

export const loadInstanceSettings = () => {
  const commandLineArguments = parseCommandLine(process.argv);
  const instanceSettings = loadSettingsFile(commandLineArguments.settingsFileName);
  return instanceSettings;
}

function loadSettingsFile(filename: string) {
  if (isAnyTest) {
    return {};
  } else {
    const settingsFileText = readTextFile(filename);
    if (!settingsFileText)
      throw new Error(`Settings file ${filename} not found.`);
    
    return JSON.parse(settingsFileText);
  }
}

const readTextFile = (filename: string): string|null => {
  return fs.readFileSync(filename, 'utf8');
}
