import * as _ from 'underscore';
import { addGraphQLResolvers, addGraphQLQuery, addGraphQLSchema } from '../../lib/vulcan-lib/graphql';
import { accessFilterMultiple } from '../../lib/utils/schemaUtils';

type FeedSubquery<SortKeyType, ResultType> = {
  type: string
  getSortKey: (result: ResultType) => SortKeyType
  doQuery: (limit: number, cutoff?: SortKeyType) => Promise<Array<ResultType>>
}

export function feedSubquery<ResultType, SortKeyType>(params: {
  type: string,
  getSortKey: (result: ResultType) => SortKeyType,
  doQuery: (limit: number, cutoff?: SortKeyType) => Promise<Array<ResultType>>
}) {
  return params;
}

export function viewBasedSubquery<ResultType extends DbObject, SortKeyType, SortFieldName extends keyof ResultType>({type, sortField, collection, context, selector}: {
  type: string,
  sortField: keyof ResultType,
  collection: CollectionBase<ResultType>,
  context: ResolverContext,
  selector: MongoSelector<ResultType>,
}) {
  return feedSubquery({
    type,
    getSortKey: (item: ResultType): SortKeyType => (item[sortField] as unknown as SortKeyType),
    doQuery: async (limit: number, cutoff: SortKeyType): Promise<Array<ResultType>> => {
      return queryWithCutoff({context, collection, selector, limit, cutoffField: sortField, cutoff});
    }
  });
}

export function fixedResultSubquery<ResultType extends DbObject, SortKeyType>({type, result, sortKey}: {
  type: string,
  result: ResultType,
  sortKey: SortKeyType,
}) {
  return feedSubquery({
    type,
    getSortKey: (item: ResultType): SortKeyType => sortKey,
    doQuery: async (limit: number, cutoff: SortKeyType): Promise<Array<ResultType>> => {
      return [result];
    }
  });
}

export function fixedIndexSubquery({type, index, result}: {
  type: string,
  index: number,
  result: any,
}) {
  return feedSubquery({
    type,
    getSortKey: ()=>index,
    doQuery: async ()=>[result],
  });
}

export function defineFeedResolver<CutoffType>({name, resolver, args, cutoffTypeGraphQL, resultTypesGraphQL}: {
  name: string,
  resolver: ({limit, cutoff, args, context}: {
    limit?: number,
    cutoff?: CutoffType|null,
    offset?: number,
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
      endOffset: Int!
      results: [${name}EntryType!]
    }
    type ${name}EntryType {
      type: String!
      ${resultTypesGraphQL}
    }
  `);
  addGraphQLQuery(`${name}(
    limit: Int,
    cutoff: ${cutoffTypeGraphQL},
    offset: Int,
    ${isNonEmptyObject(args)?", ":""}${args}
  ): ${name}QueryResults!`);
  
  addGraphQLResolvers({
    Query: {
      [name]: async (root: void, args: any, context: ResolverContext) => {
        const {limit, cutoff, offset, ...rest} = args;
        return {
          __typename: `${name}QueryResults`,
          ...await resolver({
            limit, cutoff, offset,
            args: rest,
            context
          })
        };
      }
    },
  });
}

export async function mergeFeedQueries<SortKeyType>({limit, cutoff, offset, subqueries}: {
  limit: number
  cutoff?: SortKeyType,
  offset?: number,
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
  
  // Split into results with numeric indexes and results with sort-key indexes
  const numericallyPositionedResults = _.filter(unsortedResults, r=>typeof r.sortKey==="number")
  const orderedResults = _.filter(unsortedResults, r=>typeof r.sortKey!=="number")
  
  // Sort by shared sort key
  const sortedResults = _.sortBy(orderedResults, r=>r.sortKey);
  sortedResults.reverse();
  
  // Apply cutoff
  const withCutoffApplied = cutoff
    ? _.filter(sortedResults, r=>r.sortKey<cutoff)
    : sortedResults;
  
  // Merge in the numerically positioned results
  const bothResultKinds = mergeSortedAndNumericallyPositionedResults(withCutoffApplied, numericallyPositionedResults, offset||0);
  
  // Apply limit
  const withLimitApplied = _.first(bothResultKinds, limit);
  
  // Find the last result that wasn't numerically positioned (after the limit
  // is applied), and get its sortKey to use as the page cutoff
  const nonNumericallyPositionedResults = _.filter(withLimitApplied, r => !_.some(numericallyPositionedResults, r2=>r===r2));
  const nextCutoff = (nonNumericallyPositionedResults.length>0) ? nonNumericallyPositionedResults[nonNumericallyPositionedResults.length-1].sortKey : null;
  
  return {
    results: withLimitApplied,
    cutoff: nextCutoff,
    endOffset: (offset||0)+withLimitApplied.length
  };
}

// Take a list of results that are sorted by a sort key (ie a date), and a list
// of results that have numeric indexes instead, and merge them. Eg, Recent
// Discussion contains posts sorted by date, but with some things mixed in
// with their position defined as "index 5".
function mergeSortedAndNumericallyPositionedResults(sortedResults: Array<any>, numericallyPositionedResults: Array<any>, offset: number) {
  // Take the numerically positioned results. Sort them by index, discard ones
  // from below the offset, and resolve collisions.
  const sortedNumericallyPositionedResults = _.sortBy(numericallyPositionedResults, r=>r.sortKey);
  
  let mergedResults: Array<any> = [...sortedResults];
  for (let i=0; i<sortedNumericallyPositionedResults.length; i++) {
    const insertedResult = sortedNumericallyPositionedResults[i];
    const insertionPosition = insertedResult.sortKey-offset;
    
    if (insertionPosition >= 0) {
      if (insertionPosition < mergedResults.length) {
        mergedResults.splice(insertionPosition, 0, insertedResult);
      } else {
        mergedResults.push(insertedResult);
      }
    }
  }
  
  return mergedResults;
}

function isNonEmptyObject(obj: {}): boolean {
  return Object.keys(obj).length > 0;
}

export async function queryWithCutoff<ResultType extends DbObject>({context, collection, selector, limit, cutoffField, cutoff}: {
  context: ResolverContext,
  collection: CollectionBase<ResultType>,
  selector: MongoSelector<ResultType>,
  limit: number,
  cutoffField: keyof ResultType,
  cutoff: any,
}) {
  const defaultViewSelector = collection.defaultView ? collection.defaultView({} as any).selector : {};
  const {currentUser} = context;
  
  const resultsRaw = await collection.find({
    ...defaultViewSelector,
    ...selector,
    ...(cutoff && {[cutoffField]: {$lt: cutoff}}),
  }, {
    sort: {[cutoffField]: -1, _id: 1} as Partial<Record<keyof ResultType, number>>,
    limit,
  }).fetch();
  
  return await accessFilterMultiple(currentUser, collection, resultsRaw, context);
}



