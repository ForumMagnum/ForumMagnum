
export type CommandLineArguments = {
  port: number
}

export function loadInstanceSettings() {
}
export function getCommandLineArguments(): CommandLineArguments {
  return {
    port: 3000
  };
}

