/* eslint-disable no-console */
// TODO: figure out if we can gate this on forum-type
// import './datadog/tracer';
import { CommandLineArguments } from './commandLine';
import process from 'process';
import { filterConsoleLogSpam, wrapConsoleLogFunctions } from '../lib/consoleFilters';
import { panic } from './utils/errorUtil';

const processRestartDelay = 5000;

const initConsole = () => {
  const isTTY = process.stdout.isTTY;
  const CSI = "\x1b[";
  const blue = isTTY ? `${CSI}34m` : "";
  const endBlue = isTTY ? `${CSI}39m` : "";

  filterConsoleLogSpam();
  wrapConsoleLogFunctions((log, ...message) => {
    // const pidString = clusterSetting.get() ? ` (pid: ${process.pid})` : "";
    process.stdout.write(`${blue}${new Date().toISOString()}:${endBlue} `);
    log(...message);

    // Uncomment to add stacktraces to every console.log, for debugging where
    // mysterious output came from.
    //var stack = new Error().stack
    //log(stack)
  });
}

initConsole();




export const initServer = async (commandLineArguments: CommandLineArguments) => {
  initConsole();
  if (!commandLineArguments.postgresUrl) {
    panic("Missing postgresUrl");
  }
}
