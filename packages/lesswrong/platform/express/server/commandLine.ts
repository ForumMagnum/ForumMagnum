import process from 'process';
import fs from 'fs';

interface CommandLineArguments {
  mongoUrl: string
  settingsFileName: string
}

const parseCommandLine = (argv: Array<string>): CommandLineArguments => {
  const commandLine: CommandLineArguments = {
    mongoUrl: process.env.MONGO_URL || "mongodb://localhost:27017",
    settingsFileName: "settings.json",
  }
  
  for (let i=2; i<argv.length; i++) {
    const arg = argv[i];
    switch(arg) {
      case "--settings":
        commandLine.settingsFileName = argv[++i];
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
  console.log(`Loading settings from ${filename}`);
  const settingsFileText = readTextFile(filename);
  if (!settingsFileText)
    throw new Error(`Settings file ${filename} not found.`);
  
  return JSON.parse(settingsFileText);
}

const readTextFile = (filename: string): string|null => {
  return fs.readFileSync(filename, 'utf8');
}
