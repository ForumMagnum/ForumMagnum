import path from "path";
import fs from "fs";
import process from "process";
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import type { CommandLineOptions } from "../../build";

const execAsync = promisify(exec);

/**
 * Distill all the various connection-string-related options into a
 * straightforward database connection string. Takes parsed command-line options
 * formatted as our build script's CLI-parser would parse them, ie, a dictionary
 * where arguments of the form "--opt <string>" turn into {opt: "<string>"}. If
 * connection-string arguments aren't provided, uses the environment variable
 * PG_URL as a fallback.
 *
 * Because this is used by build.js which is itself responsible for invoking the
 * Typescript compiler, it isn't in typescript. The type of this function is:
 *
 *   getDatabaseConfig: (opts: { db?: string postgresUrl?: string
 *     postgresUrlFile?: string
 *   }) => {
 *     postgresUrl: string
 *     sshTunnelCommand: string[]|null
 *   }
 *
 * If postgresUrlFile is provided, it's the path to a text file containing the
 * value of postgresUrl. If "db" is provided, it's the path to a JSON file
 * containing a JSON object of type:
 *   {
 *     postgresUrl: string
 *     sshTunnel?: {
 *       host: string
 *       key: string
 *       localPort?: number
 *     }
 *   }
 * If an sshTunnel option is provided, we will open an ssh connection to the
 * specified host using the ssh key provided, making port localPort into a
 * tunnel leading to the host from postgresUrl, and rewrite postgresUrl in the
 * return value to use the tunnel. We do this so that the connection from
 * developer machines to the ssh bastion host is compressed (the uncompressed
 * part of the connection, from the bastion host to the DB, is then within the
 * same datacenter).
 */
export function getDatabaseConfig(opts: Partial<CommandLineOptions>) {
  let dbConfig: any = null;
  if (opts.db) {
    let dbConfigFile = readFileOrDie(opts.db);
    try {
      dbConfig = JSON.parse(dbConfigFile);
    } catch(e) {
      console.error(`JSON parse error in database config file ${dbConfigFile}: ${e.message}`);
      process.exit(1);
    }
  }
  
  if (opts.postgresUrlFile) {
    opts.postgresUrl = readFileOrDie(opts.postgresUrlFile);
  }
  
  // If SSH tunnel options are provided, generate an SSH command, and rewrite
  // postgresUrl to a loopback connection.
  let tunneledPgConnectionString: string|null = null;
  let sshTunnelCommand: string[]|null = null;
  if (dbConfig?.sshTunnel && !opts.noSshTunnel) {
    if (!dbConfig.sshTunnel.key) die(`SSH tunnel needs a key`);
    if (!dbConfig.sshTunnel.host) die(`SSH tunnel needs a host`);

    const { user, password, host, port, db } = parsePgConnectionString(dbConfig.postgresUrl);
    tunneledPgConnectionString = composePgConnectionString({
      user, password, db,
      host: "localhost",
      port: (dbConfig.sshTunnel.localPort || 5433),
    });
    const sshKeyPath = path.join(path.dirname(opts.db!), dbConfig.sshTunnel.key);
    if(fs.statSync(sshKeyPath).mode & fs.constants.S_IROTH) {
      // If the key is world-readable ssh will refuse to use it, so change the permissions
      // File permissions aren't reproduced by git checkouts, so we have to do this here
      // rather than in the credentials repo.
      fs.chmodSync(sshKeyPath, 0o600);
    }

    sshTunnelCommand = [
      "-C",
      "-N",
      "-i", path.join(path.dirname(opts.db!), dbConfig.sshTunnel.key),
      "-L", `${dbConfig.sshTunnel.localPort}:${host}:${port||5432}`,
      dbConfig.sshTunnel.host
    ]
  }

  return {
    postgresUrl: opts.postgresUrl || tunneledPgConnectionString || dbConfig?.postgresUrl || process.env.PG_URL || '',
    sshTunnelCommand,
  };
}

/**
 * Parse a psql connection string into components
 */
function parsePgConnectionString(connectionString: string) {
  const match = connectionString.match(
    /postgres:\/\/((\w+)(:([^@]+))?@)?([a-zA-Z0-9\.-]+)(:([0-9]+))?\/(\w*)/
  );
  if (!match) {
    throw new Error("Could not parse postgres connection string");
  }
  const [_connectionString,_userAndPassword,user,_colonPassword,password,host,colonPort,port,db] = match;;
  return { user, password, host, port, db };
}

/**
 * Compose a set of psql connection string components into a connectionstring
 */
function composePgConnectionString({user, password, host, port, db}: {
  user: string
  password: string
  host: string
  port: string|number
  db: string
}) {
  const colonPassword = password ? `:${password}` : "";
  const colonPort = port ? `:${port}` : "";
  return `postgres://${user}${colonPassword}${(user||password) ? "@" : ""}${host}${colonPort}/${db}`;
}

/**
 * Read and trim a text file. If it doesn't exist/isn't readable/etc, print an
 * error and exit.
 */
function readFileOrDie(path: string): string {
  try {
    return fs.readFileSync(path, 'utf8').trim();
  } catch(e) {
    die(`Error reading ${path}: ${e}`);
  }
}

/**
 * Quit the process, printing a message to stderr and optionally returning the
 * specified status code (default 1).
 */
function die(message: string, status?: number): never {
  console.error(message);
  if (status !== undefined) {
    process.exit(status);
  } else {
    process.exit(1);
  }
}

export async function startSshTunnel(sshTunnelCommand: any) {
  if (sshTunnelCommand) {
    const sshHost = sshTunnelCommand.at(-1).split('@')[1];
    await execAsync(`
      if [ -z "$(ssh-keygen -F ${sshHost})" ]; then
        mkdir -p ~/.ssh
        ssh-keyscan -H ${sshHost} >> ~/.ssh/known_hosts
      fi`
    );
    
    const sshTunnelProcess = spawn("/usr/bin/ssh", sshTunnelCommand, {
      stdio: "inherit",
      detached: false,
    });

    sshTunnelProcess.on('close', (status) => {
      console.log(`SSH tunnel exited with status ${status}`);
    });
  }
}

let outputDir = './build';
export function setOutputDir(dir: string) {
  outputDir = dir;
}
export function getOutputDir() {
  return outputDir;
}

export function logWithTimestamp(...args: any[]) {
  const colorBlue = "\x1b[34m";
  const colorNormal = "\x1b[0m";
  const timestampStr = colorBlue + new Date().toISOString() + colorNormal + ':';
  console.log(timestampStr, ...args);
}

