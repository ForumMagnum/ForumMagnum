import { testStartup } from './testMain';
import chai from 'chai';
import { mongoSelectorToSql, mongoModifierToSql } from '../lib/mongoToPostgres';
import { Comments } from '../lib/collections/comments/collection';
testStartup();

describe('Mongodb to postgres query translation', () => {
  it('translates selectors correctly', () => {
    chai.assert.deepEqual(
      mongoSelectorToSql(Comments, { num: 123, str: "xyz", bool: true }),
      {
        sql: normalizeWhitespace(`
          (json->'num')::int=$1 and (json->>'str')=$2 and (json->'bool')::boolean=$3
        `),
        arg: [123, "xyz", true],
      }
    );
  });
  it('translates modifiers correctly', () => {
    chai.assert.deepEqual(
      mongoModifierToSql(Comments, { $set: {answer: false}, $inc: {voteCount:1} }),
      {
        sql: normalizeWhitespace(`
          json=json
          || jsonb_build_object("answer",$1)
          || jsonb_build_object("voteCount",json->'voteCount' + $2)
        `),
        arg: [false,1],
      }
    );
  });
});

// Replace all runs of sequential whitespace with single spaces. Allows comparing
// pretty-printed SQL queries without worrying about whether the indentation matches
// up.
function normalizeWhitespace(str: string): string {
  const ret: string[] = [];
  for (let i=0; i<str.length; i++)
  {
    let ch = str.charAt(i);
    if (/\s/.test(ch)) {
      ret.push(" ");
      while(i+1<str.length && /\s/.test(str.charAt(i+1))) {
        i++;
      }
    } else {
      ret.push(ch);
    }
  }
  return ret.join("").trim();
}
