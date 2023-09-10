/// <reference types="cypress" />

const pgp = require('pg-promise');
const { createHash } = require('crypto');

const pgDbTemplate = "unittest_cypress_template";
let pgDbName;

const pgPromiseLib = pgp();

function hashLoginToken(loginToken) {
  const hash = createHash('sha256');
  hash.update(loginToken);
  return hash.digest('base64');
};

let pgConnection = null;

const dropAndSeedPostgres = async (PG_URL) => {
  if (!PG_URL) {
    console.warn("No PG_URL provided");
    return;
  }
  const result = await fetch("http://localhost:3000/api/recreateCypressPgDb", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      templateId: pgDbTemplate,
    }),
  });

  let data;
  try {
    data = await result.json();
  } catch (e) {
    throw new Error(`Failed to parse JSON response: ${await result.text()}`);
  }
  if (data.status === "error") {
    throw new Error(data.message);
  }
  pgDbName = data.dbName;
}

const replaceDbNameInPgConnectionString = (connectionString, dbName) => {
  if (!/^postgres:\/\/.*\/[^/]+$/.test(connectionString)) {
    throw `Incorrectly formatted connection string or unrecognized connection string format: ${connectionString}`;
  }
  const lastSlash = connectionString.lastIndexOf('/');
  const withoutDbName = connectionString.slice(0, lastSlash);
  return `${withoutDbName}/${dbName}`;
}

const associateLoginTokenPostgres = async (config, {user, loginToken}) => {
  if (!config.env.PG_URL) {
    console.warn("No PG_URL provided");
    return;
  }
  const connectionString = replaceDbNameInPgConnectionString(
    config.env.PG_URL,
    pgDbName ?? pgDbTemplate,
  );
  pgConnection = pgPromiseLib({
    connectionString,
    max: 5,
  });
  const tokenData = {
    when: new Date(),
    hashedToken: hashLoginToken(loginToken),
  };
  await pgConnection.none(`
    UPDATE "Users"
    SET "services" = fm_add_to_set(
      "services",
      '{resume, loginTokens}'::TEXT[],
      $1::JSONB
    )
    WHERE _id = $2
  `, [tokenData, user._id]);
}

// eslint-disable-next-line no-unused-vars
module.exports = (on, config) => {
  on('task', {
    async dropAndSeedDatabase() {
      await dropAndSeedPostgres(config.env.PG_URL);
      return null;
    },
    async associateLoginToken(data) {
      await associateLoginTokenPostgres(config, data);
      return null;
    },
    log(data) {
      console.log(data);
      return null;
    }
  });
};
