import { isAnyTest, isMigrations } from '../lib/executionEnvironment';
import process from 'process';
import fs from 'fs';

export interface CommandLineArguments {
  postgresUrl: string
  postgresReadUrl: string
  settingsFileName: string
  shellMode: boolean,
  command?: string,
  
  // Port number to list on, and port number to use in localhost URLs. These
  // don't necessarily match, because in vite we have a proxy server on a
  // different port than the backend webserver.
  // Use --listen-port <n> and --localhost-url-port <n> to set these separately,
  // or --port <n> to set both at once.
  listenPort: number
  localhostUrlPort: number
  
}


const parseCommandLine = (argv: Array<string>): CommandLineArguments => {
  const commandLine: CommandLineArguments = {
    postgresUrl: process.env.PG_URL || "",
    postgresReadUrl: process.env.PG_READ_URL || "",
    settingsFileName: "sample_settings.json",
    shellMode: false,
    listenPort: 3000,
    localhostUrlPort: 3000,
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
      case "--command":
        commandLine.command = argv[++i];
        break;
      case "--port":
        commandLine.listenPort = commandLine.localhostUrlPort = parseInt(argv[++i]);
        break;
      case "--listen-port":
        commandLine.listenPort = parseInt(argv[++i]);
        break;
      case "--localhost-url-port":
        commandLine.localhostUrlPort = parseInt(argv[++i]);
        break;
      default:
        if (!isMigrations) {
          throw new Error(`Unrecognized command line argument: ${arg}`);
        }
    }
  }
  
  return commandLine;
}

let parsedCommandLine: CommandLineArguments|null = null;
export const getCommandLineArguments = () => {
  if (!parsedCommandLine) {
    parsedCommandLine = parseCommandLine(process.argv);
  }
  return parsedCommandLine;
}

export const getInstanceSettingsFilePath = () => {
  const clArgs = getCommandLineArguments();
  return clArgs.settingsFileName;
};

export const loadInstanceSettings = (args?: CommandLineArguments) => {
  const commandLineArguments = args ?? parseCommandLine(process.argv);
  const instanceSettings = loadSettingsFile(commandLineArguments.settingsFileName);
  return instanceSettings;
}

function loadSettingsFile(filename: string) {
  if (isAnyTest) {
    filename = "./settings-test.json";
  }
  const settingsFileText = readTextFile(filename);
  if (!settingsFileText)
    throw new Error(`Settings file ${filename} not found.`);
  return JSON.parse(settingsFileText);
}

const readTextFile = (filename: string): string|null => {
  return fs.readFileSync(filename, 'utf8');
}
