const path = require("path");
const fs = require('fs');
const process = require('process');

/**
 * Distill all the various connection-string-related options into a
 * straightforward database connection string.
 */
function getDatabaseConfig(opts) {
  let dbConfig = null;
  if (opts.db) {
    let dbConfigFile = readFileOrDie(opts.db);
    try {
      dbConfig = JSON.parse(dbConfigFile);
    } catch(e) {
      console.error(`JSON parse error in database config file ${dbConfigFile}: ${e.message}`);
      process.exit(1);
    }
  }
  
  if (opts.mongoUrlFile) {
    if (opts.mongoUrl) {
      die("More than one mongodb URL given");
    }
    opts.mongoUrl = readFileOrDie(opts.mongoUrlFile);
  }
  if (opts.postgresUrlFile) {
    opts.postgresUrl = readFileOrDie(opts.postgresUrlFile);
  }
  
  // If SSH tunnel options are provided, generate an SSH command, and rewrite
  // postgresUrl to a loopback connection.
  let tunneledPgConnectionString = null;
  let sshTunnelCommand = null;
  if (dbConfig.sshTunnel) {
    if (!dbConfig.sshTunnel.key) die(`SSH tunnel needs a key`);
    if (!dbConfig.sshTunnel.host) die(`SSH tunnel needs a host`);

    const { user, password, host, port, db } = parsePgConnectionString();
    tunneledPgConnectionString = composePgConnectionString({
      user, password, db,
      host: "localhost",
      port: (opts.sshTunnel.localPort || 5433),
    });
    sshTunnelCommand = [
      "ssh",
      "-C",
      "-i", path.join(opts.db, opts.sshTunnel.key),
      "-L", `${opts.sshTunnel.localPort}:${host}:${port}`,
      opts.sshTunnel.host
    ]
  }

  return {
    mongoUrl: opts.mongoUrl || dbConfig?.mongoUrl || process.env.MONGO_URL || null,
    postgresUrl: opts.postgresUrl || tunneledPgConnectionString || dbConfig?.postgresUrl || process.env.PG_URL || null,
    sshTunnelCommand,
  };
}

/**
 * Parse a psql connection string into components
 */
function parsePgConnectionString(connectionString) {
  const [_connectionString,user,_colonPassword,password,host,colonPort,port,db] = connectionString.match(
    /postgres:\/\/(\w+)(:([^@]+))?@([a-zA-Z0-9\.-]+)(:([0-9]+))?\/(\w*)
  );
  return { user, password, host, port, db };
}

/**
 * Compose a set of psql connection string components into a connectionstring
 */
function composePgConnectionString({user, password, host, port, db}) {
  const colonPassword = password ? `:${password}` : "";
  const colonPort = port ? `:${port}` : "";
  return `postgres://${user}${colonPassword}@${host}${colonPort}/${db}`;
}

/**
 * Read and trim a text file. If it doesn't exist/isn't readable/etc, print an
 * error and exit.
 */
function readFileOrDie(path) {
  try {
    return fs.readFileSync(path, 'utf8').trim();
  } catch(e) {
    die(`Error reading ${opts.postgresUrlFile}: ${e}`);
  }
}

/**
 * Quit the process, printing a message to stderr and optionally returning the
 * specified status code (default 1).
 */
function die(message, status) {
  console.error(message);
  if (status !== undefined) {
    process.exit(status);
  } else {
    process.exit(1);
  }
}

module.exports = { getDatabaseConfig };
