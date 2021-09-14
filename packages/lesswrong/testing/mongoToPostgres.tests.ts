import { testStartup, createPgTable } from './testMain';
import { randomId } from '../lib/random';
import chai from 'chai';
import { mongoSelectorToSql, mongoModifierToSql, FakeCollectionSchema } from '../lib/mongoToPostgres';
import { Comments } from '../lib/collections/comments/collection';
import { runQuery, getConnectionPool, getDatabase } from '../lib/mongoCollection';
testStartup();

// Like JSON.stringify, except that it treats `undefined` as valid and serializes
// it as such. Used for debug output, where having fields with the value of
// "undefined" be silently hidden would be bad.
function json_with_undefined(json: any): string {
  if (json===undefined) {
    return "undefined";
  } else if (json===null) {
    return "null";
  } else if (Array.isArray(json)) {
    return "["+(json.map(el=>json_with_undefined(el))).join(", ")+"]";
  } else if (typeof json==="object") {
    const keys = Object.keys(json);
    return "{"+(keys.map(k => `${k}: ${json_with_undefined(json[k])}`).join(", "))+"}";
  } else if (typeof json==="function") {
    return "function";
  } else {
    return JSON.stringify(json);
  }
}

// Given some rows and a selector, insert the same rows into both a mongodb
// collection and a postgres table, run a find() with the given selector
// against the mongodb collection and a translation of the selector against the
// postgres table, and check that both queries returned the same result.
async function testTranslateSelector<T extends DbObject>({rows, collection, selectors, schema}: {
  rows: any[],
  collection: CollectionBase<T>|null,
  selectors: MongoSelector<T>[],
  schema?: FakeCollectionSchema,
}): Promise<void> {
  // Get tables in mongodb and postgres
  const pgClient = getConnectionPool();
  await createPgTable(pgClient, "testselector");
  const mongoDatabase = getDatabase();
  const mongoCollection = mongoDatabase.collection("testselector");
  
  try {
    // If rows don't have _id specified, add randomly generated IDs
    const rowsWithIds = rows.map(row => ({...row, _id: row._id||randomId()}));
    
    // Insert rows into mongodb
    await mongoCollection.insertMany(rowsWithIds);
    
    // Insert rows into postgres
    for (let row of rowsWithIds) {
      const id = row._id;
      const json = {...row};
      delete json._id;
      await runQuery("INSERT INTO testselector(id,json) values ($1,$2)", [id,json]);
    }
    
    // Check that assertion worked as expeected
    const insertedRowCount = await runQuery("SELECT count(*) FROM testselector", []);
    chai.assert.deepEqual(insertedRowCount, [{count: ""+rowsWithIds.length}]);
    
    // Run the queries against both
    for (let selector of selectors) {
      let mongoResult = await mongoCollection.find(selector).toArray();
      const {sql: queryFragment, arg: queryArgs} = mongoSelectorToSql(schema!, selector);
      const assembledQuery = `SELECT * FROM testselector WHERE ${queryFragment}`;
      
      try {
        let psqlResult = await runQuery(assembledQuery, [...queryArgs]);
        
        // Flatten the postgres results
        let psqlConverted = psqlResult.map(row => ({...row.json, _id: row.id}));
        
        // Compare the results
        chai.assert.deepEqual(mongoResult, psqlConverted, `Selector ${json_with_undefined(selector)}, translated to ${assembledQuery} with ${json_with_undefined(queryArgs)}`);
      } catch(e) {
        // eslint-disable-next-line no-console
        console.error(`Selector ${json_with_undefined(selector)}, translated to ${assembledQuery} with ${json_with_undefined(queryArgs)}`);
        throw(e);
      }
    }
  } finally {
    // Clean up the mongodb collection
    await mongoCollection.removeMany({});
    // Clean up the postgres collection
    await runQuery(`DELETE FROM testselector`, []);
  }
}

describe('Mongodb to postgres selector translation', () => {
  it('translates simple selectors correctly', async () => {
    await testTranslateSelector({
      rows: [{x: false}, {x: true}],
      selectors: [{x:true}],
      collection: null,
    });
    await testTranslateSelector({
      rows: [{n: 5}, {n: 10}, {n: 15}],
      selectors: [{n: 5}, {n:6}],
      collection: null,
    });
    await testTranslateSelector({
      rows: [{s: "x"}, {s: "y"}, {s: "z"}],
      selectors: [{s: "x"}, {s: "w"}],
      collection: null,
    });
    await testTranslateSelector({
      rows: [
        {num: 123, str: "xyz", bool: true},
        {num: 321, str: "xyz", bool: true},
        {num: 123, str: "abc", bool: true},
        {num: 123, str: "xyz", bool: false},
        {str: "xyz", bool: true},
        {num: 123, bool: true},
        {num: 123, str: "xyz"},
      ],
      selectors: [{num: 123, str: "xyz", bool: true}],
      collection: null,
    });
  });
  
  it('translates selectors with null, undefined, and missing values correctly', async () => {
    await testTranslateSelector({
      rows: [
        {n: 1}, {n: 2}, {n: null}, {}
      ],
      selectors: [{n:1}, {n:null}, {n:undefined}],
      collection: null,
    });
    await testTranslateSelector({
      rows: [
        {s: "abc"},
        {s: "xyz"},
        {s: null},
        //{s: undefined}, //TODO
        {}
      ],
      selectors: [
        {s: "abc"},
        {s: null},
        {s: undefined},
        {},
      ],
      collection: null,
    });
  });
  
  it('translates selectors with range operators correctly', async () => {
    await testTranslateSelector({
      rows: [{n: 5}, {n: 10}, {n: 15}, {n: 0}, {n: null}, {}],
      selectors: [
        {n: {$gt: 10}},
        {n: {$gte: 10}},
        {n: {$lt: 10}},
        {n: {$lte: 10}},
        //{n: {$ne: 10}}, //TODO
      ],
      collection: null,
      schema: {
        n: {
          type: Number,
        }
      },
    });
  });
  
  it('translates selectors with and/or operators correctly', async () => {
    await testTranslateSelector({
      rows: [
        {n: 1, s: "abc"},
        {n: 2, s: "abc"},
        {n: 1, s: "xyz"},
        {n: 2, s: "xyz"},
        {n: 3, s: "abc"},
        {n: 3, s: "xyz"},
        {},
      ],
      selectors: [
        {$or: [{n:1}, {s:"xyz"}]},
        {$or: [{n:1, s:"xyz"}, {}]},
        {$and: [{n:1}, {s:"xyz"}]},
        {$and: [{n:1, s:"xyz"}, {}]},
        {$or: [
          {$and: [{n:1}, {s:"abc"}]},
          {$and: [{n:2}, {s:"xyz"}]},
        ]},
        {$and: [
          {$or: [{n:1}, {n:3}]},
          {$or: [{s:"abc"}, {s:"def"}]},
        ]},
      ],
      collection: null,
    });
    await testTranslateSelector({
      rows: [
        {s: "abc"}, {s: "xyz"}, {s: ""}, {},
      ],
      selectors: [
        {s: {$exists: true}},
        {s: {$exists: false}},
        {s: {$exists: false}},
        //{s: {$ne: "abc"}}, //TODO
      ],
      collection: null,
    });
  });
  
  it('translates selectors with dates correctly', async () => {
    const now = new Date();
    const yesterday = new Date(new Date().getTime() - (1000*60*60*24));
    const lastWeek = new Date(new Date().getTime() - (1000*60*60*24*6));
    
    await testTranslateSelector({
      rows: [
        {when: now},
        {when: yesterday},
        {when: lastWeek},
        {when: null},
        {when: undefined},
        {},
      ],
      selectors: [
        {when: {$gte: yesterday}},
        {when: {$gt: yesterday}},
        {when: {$lte: yesterday}},
        {when: {$lt: yesterday}},
      ],
      collection: null,
    });
  });
  
  it('translates nested selectors correctly', async () => {
    await testTranslateSelector({
      rows: [
        {obj: ["xyz", "abc"]},
      ],
      selectors: [
        {obj: "xyz"}
      ],
      collection: null,
    });
    await testTranslateSelector({
      rows: [
        {obj: ["xyz", "abc"]},
        {outerObj: [
          {innerObj: ["xyz", "abc"]},
          {innerObj: ["def", "ghi"]},
        ]},
      ],
      selectors: [
        {obj: "xyz"},
        {"obj.outerObj.innerObj": "def"},
      ],
      collection: null,
    });
  });
});
