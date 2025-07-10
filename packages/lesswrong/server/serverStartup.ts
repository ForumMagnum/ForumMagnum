/* eslint-disable no-console */
// TODO: figure out if we can gate this on forum-type
// import './datadog/tracer';
import '@/lib/utils/extendSimpleSchemaOptions';
import { createSqlConnection } from './sqlConnection';
import { replaceDbNameInPgConnectionString, setSqlClient, getSqlClient } from './sql/sqlClient';
import type { DbTarget } from './sql/PgCollection';
import { isAnyTest } from '../lib/executionEnvironment';
import { refreshSettingsCaches } from './loadDatabaseSettings';
import { CommandLineArguments, getCommandLineArguments } from './commandLine';
import { getBranchDbName } from "./branchDb";
import { dropAndCreatePg } from './testingSqlClient';
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

const connectToPostgres = (connectionString: string, target: DbTarget = "write") => {
  try {
    if (connectionString && !getSqlClient(target)) {
      const dbName = /.*\/(.*)/.exec(connectionString)?.[1];
      // eslint-disable-next-line no-console
      console.log(`Connecting to postgres (${dbName})`);
      const sql = createSqlConnection(connectionString, false);
      setSqlClient(sql, target);
    }
  } catch(err) {
    // eslint-disable-next-line no-console
    console.error("Failed to connect to postgres: ", err.message);
    process.exit(1);
  }
}

export const initDatabases = ({postgresUrl, postgresReadUrl}: Pick<CommandLineArguments, 'postgresUrl' | 'postgresReadUrl'>) => {
  connectToPostgres(postgresUrl);
  connectToPostgres(postgresReadUrl, "read");
};

export const initSettings = () => {
  // if (!isAnyTest) {
  //   setInterval(refreshSettingsCaches, 1000 * 60 * 5) // We refresh the cache every 5 minutes on all servers
  // }
  return refreshSettingsCaches();
}


export const initServer = async (commandLineArguments: CommandLineArguments) => {
  initConsole();
  if (!commandLineArguments.postgresUrl) {
    panic("Missing postgresUrl");
  }
  await initDatabases(commandLineArguments);
  await initSettings();
  // importAllServerFiles();
  // await initPostgres();
}

// function importAllServerFiles() {
//   require('../server.ts');
// }

// function getClusterRole(): "standalone"|"primary"|"worker" {
//   if (!clusterSetting.get()) {
//     return "standalone";
//   }
//   if (cluster.isPrimary) {
//     return "primary";
//   } else {
//     return "worker";
//   }
// }

// export const serverStartup = async () => {
//   const commandLineArguments = getCommandLineArguments();
//   const clusterRole = getClusterRole();

//   // Use OS load balancing (as opposed to round-robin)
//   // In principle, this should give better performance because it is aware of resource (cpu) usage
//   if (clusterRole !== "standalone") {
//     cluster.schedulingPolicy = cluster.SCHED_NONE
//   }

//   if (clusterRole === "primary") {
//     // Initialize db connection and a few other things such as settings, but don't start a webserver.
//     console.log("Initializing primary process");
//     await initServer(commandLineArguments);

//     const numWorkers = numWorkersSetting.get();

//     console.log(`Running in cluster mode with ${numWorkers} workers (vs ${numCPUs} cpus)`);
//     console.log(`Primary ${process.pid} is running, about to fork workers`);

//     // Fork workers.
//     for (let i = 0; i < numWorkers; i++) {
//       cluster.fork();
//     }

//     cluster.on('exit', (worker, _code, _signal) => {
//       console.log(`Worker ${worker.process.pid} died`);
//       setTimeout(() => cluster.fork(), processRestartDelay);
//     });
//   } else {
//     if (clusterRole !== "standalone") {
//       console.log(`Starting worker ${process.pid}`);
//     }
    
//     await initServer(commandLineArguments);
//     const { serverMain } = require('./serverMain');
//     await serverMain(commandLineArguments);

//     if (clusterRole !== "standalone") {
//       console.log(`Worker ${process.pid} started`);
//     }
//   }
// }
