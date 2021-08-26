import { testStartup } from './testMain';
import { runQuery } from '../lib/mongoCollection';
import chai from 'chai';
testStartup();

describe('Postgres connection', () => {
  it('is connected to an initialized database', async () => {
    // It can run a trivial psql query
    chai.assert.deepEqual(
      await runQuery("select 1+1 as x", []),
      [{x:2}]
    );
    
    // There is a table named users, and it has zero rows
    chai.assert.deepEqual(
      await runQuery("select count(*) as rowcount from users", []),
      [{rowcount: "0"}]
    );
  });
});
