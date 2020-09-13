import * as _ from 'underscore';
import { addGraphQLResolvers, addGraphQLQuery, addGraphQLSchema } from '../../lib/vulcan-lib/graphql';

export const DATE_MAX = new Date(8640000000000000);
export const DATE_MIN = new Date(-8640000000000000);

export function feedSubquery<ResultType, SortKeyType>(params: {
  type: string,
  getSortKey: (result: ResultType) => SortKeyType,
  doQuery: (limit: number, cutoff?: SortKeyType) => Promise<Array<ResultType>>
}) {
  return params;
}

export function defineFeedResolver<CutoffType>({name, resolver, args, cutoffTypeGraphQL, resultTypesGraphQL}: {
  name: string,
  resolver: ({limit, cutoff, args, context}: {
    limit?: number, cutoff?: CutoffType|null,
    args: any, context: ResolverContext
  }) => Promise<{
    cutoff: CutoffType|null,
    results: Array<any>
  }>,
  args: string,
  cutoffTypeGraphQL: string,
  resultTypesGraphQL: string,
}) {
  addGraphQLSchema(`
    type ${name}QueryResults {
      cutoff: Date
      results: [${name}EntryType!]
    }
    type ${name}EntryType {
      type: String!
      ${resultTypesGraphQL}
    }
  `);
  addGraphQLQuery(`${name}(limit: Int, cutoff: ${cutoffTypeGraphQL}${isNonEmptyObject(args)?", ":""}${args}): ${name}QueryResults!`);
  
  addGraphQLResolvers({
    Query: {
      [name]: async (root: void, args: any, context: ResolverContext) => {
        const {limit, cutoff, ...rest} = args;
        return await resolver({
          limit, cutoff,
          args: rest,
          context
        });
      }
    },
  });
}

export async function mergeFeedQueries<SortKeyType>({limit, cutoff, subqueries}: {
  limit: number
  cutoff?: SortKeyType,
  subqueries: Array<any>
}) {
  // Perform the subqueries
  const unsortedSubqueryResults = await Promise.all(
    subqueries.map(async (subquery) => {
      const subqueryResults = await subquery.doQuery(limit, cutoff)
      return subqueryResults.map(result => ({
        type: subquery.type,
        sortKey: subquery.getSortKey(result),
        [subquery.type]: result,
      }))
    })
  );
  
  // Merge the result lists
  const unsortedResults = _.flatten(unsortedSubqueryResults);
  
  // Sort by shared sort key
  const sortedResults = _.sortBy(unsortedResults, r=>r.sortKey);
  sortedResults.reverse();
  
  // Apply limit and cutoff
  const withCutoffApplied = cutoff
    ? _.filter(sortedResults, r=>r.sortKey<cutoff)
    : sortedResults;
  const withLimitApplied = _.first(withCutoffApplied, limit);
  
  return {
    results: withLimitApplied,
    cutoff: withLimitApplied.length>0 ? withLimitApplied[withLimitApplied.length-1].sortKey : null,
  };
}

function isNonEmptyObject(obj: {}): boolean {
  return Object.keys(obj).length > 0;
}

