import _ from 'underscore';
import { addGraphQLResolvers, addGraphQLQuery, addGraphQLSchema } from '../../lib/vulcan-lib/graphql';
import { accessFilterMultiple } from '../../lib/utils/schemaUtils';

export type FeedSubquery<ResultType extends DbObject, SortKeyType> = {
  type: string,
  getSortKey: (item: ResultType) => SortKeyType,
  isNumericallyPositioned?: boolean,
  doQuery: (limit: number, cutoff?: SortKeyType) => Promise<Array<ResultType>>,
}

export type SortDirection = "asc" | "desc";

export type StaticSortField<ResultType extends DbObject, SortFieldName extends keyof ResultType> = {
  sortField: SortFieldName,
  sortDirection?: SortDirection,
}

export type DynamicSortField<ResultType extends DbObject, SortKeyType, SortFieldName extends keyof ResultType> = {
  getSortKey: (item: ResultType) => SortKeyType,
  cutoffField: SortFieldName,
  sortDirection?: SortDirection,
}

export type ViewBasedSubqueryProps<ResultType extends DbObject, SortKeyType, SortFieldName extends keyof ResultType> = {
  type: string,
  collection: CollectionBase<ResultType>,
  context: ResolverContext,
  selector: MongoSelector<ResultType>,
} & (
  StaticSortField<ResultType, SortFieldName> |
  DynamicSortField<ResultType, SortKeyType, SortFieldName>
)

const resolveSortField = <
  ResultType extends DbObject,
  SortKeyType,
  SortFieldName extends keyof ResultType
>(props: ViewBasedSubqueryProps<ResultType, SortKeyType, SortFieldName>) => {
  if ("sortField" in props) {
    return {
      getSortKey: (item: ResultType) => item[props.sortField] as unknown as SortKeyType,
      cutoffField: props.sortField,
    }
  } else {
    return {
      getSortKey: props.getSortKey,
      cutoffField: props.cutoffField,
    }
  }
}

export function viewBasedSubquery<
  ResultType extends DbObject,
  SortKeyType,
  SortFieldName extends keyof ResultType
>(props: ViewBasedSubqueryProps<ResultType, SortKeyType, SortFieldName>): FeedSubquery<ResultType, SortKeyType> {
  props.sortDirection ??= "desc";
  const {type, collection, context, selector, sortDirection} = props;
  const {getSortKey, cutoffField} = resolveSortField(props);
  return {
    type,
    getSortKey,
    doQuery: async (limit: number, cutoff: SortKeyType): Promise<Array<ResultType>> => {
      return queryWithCutoff({context, collection, selector, limit, cutoffField, cutoff, sortDirection});
    }
  };
}

export function fixedResultSubquery<ResultType extends DbObject, SortKeyType>({type, result, sortKey}: {
  type: string,
  result: ResultType,
  sortKey: SortKeyType,
}): FeedSubquery<ResultType, SortKeyType> {
  return {
    type,
    getSortKey: (_item: ResultType): SortKeyType => sortKey,
    doQuery: async (_limit: number, _cutoff: SortKeyType): Promise<Array<ResultType>> => {
      return [result];
    }
  };
}

export function fixedIndexSubquery<ResultType extends DbObject>({type, index, result}: {
  type: string,
  index: number,
  result: any,
}): FeedSubquery<ResultType, number> {
  return {
    type,
    getSortKey: () => index,
    isNumericallyPositioned: true,
    doQuery: async () => [result],
  };
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
      cutoff: ${cutoffTypeGraphQL}
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
      [name]: async (_root: void, args: any, context: ResolverContext) => {
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

const applyCutoff = <SortKeyType>(
  sortedResults: {sortKey: SortKeyType}[],
  cutoff: SortKeyType,
  sortDirection: SortDirection,
) => {
  const cutoffFilter = sortDirection === "asc"
    ? ({sortKey}) => sortKey > cutoff
    : ({sortKey}) => sortKey < cutoff;
  return _.filter(sortedResults, cutoffFilter);
}

export async function mergeFeedQueries<SortKeyType>({limit, cutoff, offset, sortDirection, subqueries}: {
  limit: number
  cutoff?: SortKeyType,
  offset?: number,
  sortDirection?: SortDirection,
  subqueries: Array<any>,
}) {
  sortDirection ??= "desc";

  // Perform the subqueries
  const unsortedSubqueryResults = await Promise.all(
    subqueries.map(async (subquery) => {
      const subqueryResults = await subquery.doQuery(limit, cutoff)
      return subqueryResults.map((result: DbObject) => ({
        type: subquery.type,
        sortKey: subquery.getSortKey(result),
        [subquery.type]: result,
      }))
    })
  );
  
  // Merge the result lists
  const unsortedResults = _.flatten(unsortedSubqueryResults);
  
  // Split into results with numeric indexes and results with sort-key indexes
  const [
    numericallyPositionedResults,
    orderedResults,
  ] = _.partition(unsortedResults, ({isNumericallyPositioned}) => isNumericallyPositioned);
  
  // Sort by shared sort key
  const sortedResults = _.sortBy(orderedResults, r=>r.sortKey);
  if (sortDirection === "desc") {
    sortedResults.reverse();
  }
  
  // Apply cutoff
  const withCutoffApplied = cutoff
    ? applyCutoff(sortedResults, cutoff, sortDirection)
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

async function queryWithCutoff<ResultType extends DbObject>({
  context, collection, selector, limit, cutoffField, cutoff, sortDirection,
}: {
  context: ResolverContext,
  collection: CollectionBase<ResultType>,
  selector: MongoSelector<ResultType>,
  limit: number,
  cutoffField: keyof ResultType,
  cutoff: any,
  sortDirection: SortDirection,
}) {
  const defaultViewSelector = collection.defaultView ? collection.defaultView({} as any).selector : {};
  const {currentUser} = context;

  const sort = {[cutoffField]: sortDirection === "asc" ? 1 : -1, _id: 1};
  const cutoffSelector = cutoff
    ? {[cutoffField]: {[sortDirection === "asc" ? "$gt" : "$lt"]: cutoff}}
    : {};
  const resultsRaw = await collection.find({
    ...defaultViewSelector,
    ...selector,
    ...cutoffSelector,
  }, {
    sort: sort as Partial<Record<keyof ResultType, number>>,
    limit,
  }).fetch();

  return await accessFilterMultiple(currentUser, collection, resultsRaw, context);
}
