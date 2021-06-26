import process from 'process';
import fs from 'fs';
import BSONStream from 'bson-stream';
import filter from 'lodash/filter';
import map from 'lodash/map';
import stream from 'stream';
import { Pool } from 'pg';

type CommandLineOptions = {
  mongoDumpDirectory: string
  postgresConnectionString: string
  doNothing: boolean
  dryRun: boolean
  onlyCollection: string|null
}
const defaultOptions: CommandLineOptions = {
  mongoDumpDirectory: "",
  postgresConnectionString: "",
  doNothing: false,
  dryRun: false,
  onlyCollection: null,
}

function parseCommandLine(argv: string[]) {
  let ret: Partial<CommandLineOptions> = defaultOptions;
  for (let i=2; i<argv.length; i++) {
    if (argv[i]==="-h" || argv[i]=="--help") {
      printHelpText();
      ret.doNothing = true;
    }else if (argv[i]==="--mongo-dump-directory") {
      if (i+1>=argv.length) throw new Error("Additional argument required");
      ret.mongoDumpDirectory = argv[++i];
    } else if (argv[i]==="--postgres-connection-string") {
      if (i+1>=argv.length) throw new Error("Additional argument required");
      ret.postgresConnectionString = argv[++i];
    } else if (argv[i]==="--dry-run") {
      ret.dryRun = true;
    } else if (argv[i]==="--only-collection") {
      if (i+1>=argv.length) throw new Error("Additional argument required");
      ret.onlyCollection = argv[++i];
    } else {
      throw new Error("Unrecognized argument: "+argv[i]);
    }
  }
  
  if (!(ret.mongoDumpDirectory?.length)) {
    printHelpText();
    console.log("Missing required argument: --mongo-dump-directory");
    ret.doNothing = true;
  }
  if (!(ret.postgresConnectionString?.length)) {
    printHelpText();
    console.log("Missing required argument: --postgres-connection-string");
    ret.doNothing = true;
  }
  
  return ret as CommandLineOptions;
}

let helpPrinted = false;
function printHelpText()
{
  if (helpPrinted) return;
  helpPrinted = true;
  
  console.log(`Usage: scripts/mongoToPostgres/run
    --mongo-dump-directory [dir]
      Directory of an exported mongodb database dump. Created with the
      "mongodump" tool, with an invocation that looks something like:
        mongodump -o <output-directory> <mongo-connection-string>
      Check that you have enough free disk space for a copy of the database
      you're exporting first.
      
    --postgres-connection-string [dir]
      Connection string for the postgres database to import into. Looks like:
      postgres://user:password@host/database

    --dry-run
      Go through the importing process without actually writing anything. Used
      for testing.

    --only-collection [collection]
      Optional. Only import the named collection, rather than all collections.
`);
}

const excludedCollections: string[] = [
  // Vulcan example-forum junk
  "movies", "categories",
  // Other junk of unclear origin
  "usercollectionrels", "usersequencerels", "roles", "objectlabs-system", "objectlabs-system.admin.collections",
  // TODO Disabled during experimentation, because there are issues to work
  // around, but need to be reenabled before using this script for production:
  // (Specifically: Rows in these collections have _id fields of type ObjectID
  // rather than string.)
  "databasemetadata", "debouncerevents", "lwevents", "readstatuses",
];
function isExcludedCollection(collectionName: string, options: CommandLineOptions) {
  if (options.onlyCollection)
    return collectionName!==options.onlyCollection;
  return collectionName.startsWith("ROLLBACKS_")
    || collectionName.startsWith("meteor_")
    || excludedCollections.find(c=>c===collectionName)
}

async function foreachRowInBsonFile(filename: string, fn: (row: any)=>Promise<void>) {
  let readStream = fs.createReadStream(filename);
  const bsonStream = new BSONStream();
  await new Promise<null>((resolve,reject) => {
    const writeToDbStream = new stream.Writable({
      objectMode: true,
      
      async write(chunk, encoding, callback) {
        await fn(chunk);
        callback();
      },
      async writev(chunks, callback) {
        for (let chunk of chunks) {
          await fn(chunk.chunk);
        }
        callback();
      },
      destroy() {
        resolve(null);
      }
    });
    readStream.pipe(bsonStream)
    bsonStream.pipe(writeToDbStream);
  });
}

// Validate a row, before transferring it. Returns true if the row is valid,
// returns false if there's an error which means the row should be skipped,
// and throws an exception if there's a serious problem.
function validateMongoRow(row: any, collectionName: string): boolean {
  if (!row._id) {
    throw new Error("Row is missing _id");
  /*} else if (typeof row._id !== 'string') {
    console.error(`_id in ${collectionName} is not a string: type ${typeof row._id}, stringifies to ${JSON.stringify(row._id)}`);
    if (row.slug)
      console.log(`    slug is: ${row.slug}`);
    return false;*/
  } else if (row._id.toString().length > 24) {
    console.error(`_id in ${collectionName} is too long: ${row._id}`);
    return false;
  }
  
  return true;
}

async function runQuery(connectionPool: Pool, query: string, values?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    connectionPool.query(query, values||[], (err: any, res: any) => {
      if (err) {
        console.error("Error running query");
        console.error(err);
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
}

async function createTable(collectionName: string, options: CommandLineOptions, connectionPool: Pool) {
  if (!options.dryRun) {
    await runQuery(connectionPool, `CREATE TABLE IF NOT EXISTS ${collectionName} (
      id varchar(24) NOT NULL PRIMARY KEY,
      json jsonb NOT NULL
    );`);
  }
}

async function performImport(options: CommandLineOptions, connectionPool: Pool) {
  const filesInDump = fs.readdirSync(options.mongoDumpDirectory);
  const collectionNames = map(filter(filesInDump, filename=>filename.endsWith(".bson")), filename=>filename.substr(0, filename.length-".bson".length));
  const filteredCollectionNames = filter(collectionNames, c=>!isExcludedCollection(c, options));
  
  for (let collectionName of filteredCollectionNames)
  {
    console.log(`Importing ${collectionName}`);
    await createTable(collectionName, options, connectionPool);
    let rowCount=0;
    await foreachRowInBsonFile(`${options.mongoDumpDirectory}/${collectionName}.bson`, async (row: any) => {
      if (validateMongoRow(row, collectionName)) {
        if (!options.dryRun) {
          const rowCopy = {...row};
          const id = row._id.toString();
          delete rowCopy._id;
          await runQuery(connectionPool, `INSERT INTO ${collectionName}(id, json) values ($1, $2)`, [id, rowCopy]);
        }
      }
      rowCount++;
    });
    console.log(`Imported ${rowCount} rows`);
  }
}

function main() {
  const commandLineOptions = parseCommandLine(process.argv);
  if (commandLineOptions.doNothing) return;
  const connectionPool = new Pool({ connectionString: commandLineOptions.postgresConnectionString });
  performImport(commandLineOptions, connectionPool);
}

main();
