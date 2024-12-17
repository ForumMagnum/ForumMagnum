
export type CommandLineArguments = {
  listenPort: number,
  localhostUrlPort: number,
}

export function loadInstanceSettings() {
}
export function getCommandLineArguments(): CommandLineArguments {
  return {
    listenPort: 3000,
    localhostUrlPort: 3000,
  };
}

