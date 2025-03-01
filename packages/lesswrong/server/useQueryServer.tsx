import React, { createContext, useContext } from "react";
import { type DocumentNode, type QueryHookOptions, type TypedDocumentNode, type QueryResult, type OperationVariables, NetworkStatus } from "@apollo/client";
import { print as parsedGraphqlToString} from 'graphql/language/printer';
import { renderToString } from "react-dom/server";
import { ASTVisitor, visit, SelectionSetNode, FieldNode, ASTNode, ArgumentNode, FragmentSpreadNode, FragmentDefinitionNode } from "graphql";

type GraphQLQueryStatus = {
  queryStr: string
  query: DocumentNode
  variables: any
  finished: boolean
  result: any
  promise: Promise<void>
}

type GraphQLExecuteFn = (queryStr: string, variables: any) => Promise<any>

export class SSRGraphQLCache {
  private queries: Record<string, GraphQLQueryStatus> = {};
  private runQuery: GraphQLExecuteFn
  
  constructor(runQuery: GraphQLExecuteFn) {
    this.runQuery = runQuery
  }

  getQuery(query: DocumentNode, variables: any) {
    const withTypenames = this.addTypenamesToQuery(query);
    const queryStr = parsedGraphqlToString(withTypenames);
    const queryKey = queryStr + sortedKeyJsonStringify(variables);

    if (queryKey in this.queries) {
      return this.queries[queryKey];
    } else {
      const promise = this.runQuery(queryStr, variables)
      const queryStatus = {
        query: withTypenames, queryStr,
        variables,
        finished: false,
        result: null,
        promise,
      };
      this.queries[queryKey] = queryStatus;
      queryStatus.promise = promise.then((result) => {
        queryStatus.finished = true;
        queryStatus.result = result;
      });
      return queryStatus;
    }
  }
  
  numQueries(): number {
    return Object.keys(this.queries).length;
  }

  async waitForAllQueries(): Promise<void> {
    await Promise.all(
      Object.values(this.queries)
        .filter(q=>!q.finished)
        .map(q=>q.promise)
    );
  }
  
  exportAsApolloClientCache(): any {
    const queryResults = Object.fromEntries(
      Object.entries(this.queries).flatMap(
        ([_queryKey,qs]) => this.getQueryCacheEntries(qs, qs.variables)
      )
    );
    const {modifiedQueries, cacheObjects} = this.extractReferencedObjects(queryResults);

    return {
      ROOT_QUERY: {
        "__typename": "Query",
        ...modifiedQueries,
      },
      ...cacheObjects,
    };
  }

  getQueryCacheEntries(qs: GraphQLQueryStatus, variables: any): [string,any][] {
    const resultWithArgumentsOnResolverFields = this.addArgumentsToResolverFields(
      qs.query, qs.result.data, qs.variables
    );
    return Object.entries(resultWithArgumentsOnResolverFields);
    /*return Object.entries(resultWithArgumentsOnResolverFields).map(([name,value]) => {
      const nameWithArgs = Object.keys(variables ?? {}).length > 0
        ? `${name}(${sortedKeyJsonStringify(variables)})`
        : name;
      return [nameWithArgs, value];
    });*/
  }
  
  /**
   * The provided JSON object is a set of graphql query results. Some of the
   * tree nodes are JSON objects with _id and __typename fields. Extract those
   * into a cacheObjects object, where keys are of the form `Typename:_id` and
   * values are the extracted objects. Side-effectfully replace each extracted
   * object with {"__ref":"Typename:_id"}. When two objects share a typename
   * and _id, deep-merge them.
   */
  extractReferencedObjects(queryResults: any): {
    modifiedQueries: any
    cacheObjects: any
  } {
    type JsonObject=any; type JsonValue=any;
    const cacheObjects: JsonObject = {};
  
    function deepMerge(target: JsonObject, source: JsonObject): JsonObject {
      const result = { ...target };
      for (const key in source) {
        if (key in source) {
          if (isObject(result[key]) && isObject(source[key])) {
            result[key] = deepMerge(
              result[key] as JsonObject,
              source[key] as JsonObject
            );
          } else {
            result[key] = source[key];
          }
        }
      }
      return result;
    }
  
    function isObject(value: JsonValue): value is JsonObject {
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    }
  
    function processValue(value: JsonValue): JsonValue {
      if (Array.isArray(value)) {
        return value.map(item => processValue(item));
      }
  
      if (!isObject(value)) {
        return value;
      }
  
      // Check if this is a referenced object (has _id and __typename)
      if (value._id && value.__typename) {
        const refKey = `${value.__typename}:${value._id}`;
        
        // If this object is already in cache, merge them
        if (cacheObjects[refKey]) {
          cacheObjects[refKey] = deepMerge(
            cacheObjects[refKey] as JsonObject,
            value
          );
        } else {
          // Process all nested values before caching
          const processedObject = { ...value };
          for (const key in processedObject) {
            if (key in processedObject) {
              processedObject[key] = processValue(processedObject[key]);
            }
          }
          cacheObjects[refKey] = processedObject;
        }
  
        // Return reference
        return { __ref: refKey };
      }
  
      // Process all properties of regular objects
      const result: JsonObject = {};
      for (const key in value) {
        if (key in value) {
          result[key] = processValue(value[key]);
        }
      }
      return result;
    }
  
    // Process the root object
    const modifiedQueries = processValue(queryResults);
  
    return {modifiedQueries, cacheObjects};
  }
  
  addTypenamesToQuery(query: DocumentNode) {
    const addTypenameVisitor: ASTVisitor = {
      SelectionSet: {
        enter(node: SelectionSetNode, key: string | number | undefined, parent: ASTNode | undefined) {
          // Skip if this is the root selection set (parent will be an OperationDefinition or FragmentDefinition)
          if (parent && (parent.kind === 'OperationDefinition' || parent.kind === 'FragmentDefinition')) {
            return node;
          }
        },
        leave(node: SelectionSetNode, key: string | number | undefined, parent: ASTNode | undefined) {
          // Skip if this is the root selection set
          if (parent && (parent.kind === 'OperationDefinition' || parent.kind === 'FragmentDefinition')) {
            return node;
          }
      
          // Check if __typename is already present in this selection set
          const hasTypename = node.selections.some(selection => {
            if (selection.kind === 'Field') {
              const field = selection as FieldNode;
              return field.name.value === '__typename';
            }
            return false;
          });
      
          // If not, add the __typename field to the selections
          if (!hasTypename) {
            const typenameField: FieldNode = {
              kind: 'Field',
              name: { kind: 'Name', value: '__typename' },
            };
            return {
              ...node,
              selections: [typenameField, ...node.selections],
            };
          }
          return node;
        },
      },
    };

    return {
      ...query,
      definitions: query.definitions.map(d => visit(d, addTypenameVisitor)),
    };
  }

  addArgumentsToResolverFields(query: DocumentNode, results: any, variables: any): any {
    // First, build a map of field paths to their arguments
    const fieldArgsMap = new Map<string, string>();
    
    // Helper to collect field arguments from the query
    const collectFieldArguments = (selectionSet: SelectionSetNode, prefix: string) => {
      for (const selection of selectionSet.selections) {
        if (selection.kind === 'Field') {
          const fieldName = selection.name.value;
          
          // Skip introspection fields
          if (fieldName.startsWith('__')) {
            continue;
          }
  
          // If field has arguments, store them
          if (selection.arguments && selection.arguments.length > 0) {
            const argsStr = argumentsToString(selection.arguments, variables);
            fieldArgsMap.set(`${prefix}${fieldName}`, argsStr);
          }
  
          // Recurse into nested selections
          if (selection.selectionSet) {
            collectFieldArguments(selection.selectionSet, `${prefix}${fieldName}.`);
          }
        } else if (selection.kind === 'FragmentSpread') {
          // Find and process fragment
          const fragmentDef = query.definitions.find(
            def => 
              def.kind === 'FragmentDefinition' && 
              (def as FragmentDefinitionNode).name.value === selection.name.value
          ) as FragmentDefinitionNode;
  
          if (fragmentDef) {
            collectFieldArguments(fragmentDef.selectionSet, prefix);
          }
        }
      }
    };
  
    // Collect all field arguments from the query
    for (const def of query.definitions) {
      if (def.kind === 'OperationDefinition' || def.kind === 'FragmentDefinition') {
        collectFieldArguments(def.selectionSet, "");
      }
    }
  
    // Function to process results recursively
    const processResults = (obj: any): any => {
      if (!obj || typeof obj !== 'object') {
        return obj;
      }
  
      // Handle arrays
      if (Array.isArray(obj)) {
        return obj.map(item => processResults(item));
      }
  
      const newObj: any = {};
      
      for (const [key, value] of Object.entries(obj)) {
        // Skip if this is an introspection field
        if (key.startsWith('__')) {
          newObj[key] = value;
          continue;
        }
  
        // Check if this field had arguments
        const args = fieldArgsMap.get(key);
        const newKey = args ? `${key}${args}` : key;
  
        // Recursively process nested objects
        newObj[newKey] = processResults(value);
      }
  
      return newObj;
    };
  
    return processResults(results);
  }
}

const GraphQLResultsContext = createContext<SSRGraphQLCache|null>(null);

export function useQueryServer<TData=any, TVariables=OperationVariables>(
  query: DocumentNode|TypedDocumentNode<TData,TVariables>, options?: QueryHookOptions<TData, TVariables>
): Omit<QueryResult<TData, TVariables>, "client"|"startPolling"|"stopPolling"|"subscribeToMore"|"updateQuery"> {
  const resultsCache = useContext(GraphQLResultsContext);

  if (options?.skip || !options?.ssr) {
    return {
      data: undefined,
      loading: true,
      networkStatus: NetworkStatus.ready,
      variables: options?.variables,

      refetch: (async ()=>{}) as any,
      fetchMore: (()=>{}) as any,
      called: true,
    };
  }
  
  const queryStatus = resultsCache!.getQuery(query, options?.variables);
  if (queryStatus.finished) {
    return {
      data: queryStatus.result.data,
      loading: false,
      networkStatus: NetworkStatus.ready,
      variables: options?.variables,

      refetch: (async ()=>{}) as any,
      fetchMore: (()=>{}) as any,
      called: true,
    };
  } else {
    return {
      data: undefined,
      loading: true,
      networkStatus: NetworkStatus.loading,
      variables: options?.variables,

      refetch: (async ()=>{}) as any,
      fetchMore: (()=>{}) as any,
      called: true,
    };
  }
}

export async function renderSSR(root: React.ReactNode, runQuery: GraphQLExecuteFn): Promise<{
  html: string
  cache: SSRGraphQLCache
}> {
  const cache = new SSRGraphQLCache(runQuery);
  let lastRender = "";
  let lastQueryCount = 0;

  // eslint-disable-next-line
  while (true) {
    console.log("Starting render pass");
    lastRender = renderToString(<GraphQLResultsContext.Provider value={cache}>
      {root}
    </GraphQLResultsContext.Provider>);
    console.log("Finished render pass");
    await cache.waitForAllQueries();
    
    let newNumQueries = cache.numQueries()
    if (newNumQueries-lastQueryCount > 0) {
      console.log(`Finished ${newNumQueries-lastQueryCount} queries`);
    }
    if (lastQueryCount === newNumQueries)
      break;
    lastQueryCount = newNumQueries;
  }
  
  console.log("SSR complete");
  return {
    html: lastRender,
    cache,
  };
}

function sortedKeyJsonStringify(value: any, indent = undefined) {
  // Handle different types of values
  switch (typeof value) {
    case 'string':
      return JSON.stringify(value);
    
    case 'number':
    case 'boolean':
    case 'undefined':
      return String(value);
      
    case 'object':
      // Handle null
      if (value === null) {
        return 'null';
      }
      
      if (Array.isArray(value)) {
        // Handle arrays
        const items: any = value.map(item => sortedKeyJsonStringify(item, indent))
          .join(',');
        return `[${items}]`;
      } else {
        // Handle objects
        const sortedKeys = Object.keys(value).sort();
        const items: any = sortedKeys
          .filter(key => value[key] !== undefined)
          .map(key => {
            const keyStr = JSON.stringify(key);
            const valueStr = sortedKeyJsonStringify(value[key], indent);
            return `${keyStr}:${valueStr}`;
          }).join(',');
        return `{${items}}`;
      }
      
    default:
      throw new Error(`Unsupported type: ${typeof value}`);
  }
}

function argumentsToString(args: readonly ArgumentNode[], variables: any): string {
  if (!args.length) return '';
  const argsStr = sortedKeyJsonStringify(Object.fromEntries(
    args.map(arg => [arg.name.value, variables[arg.name.value]])
  ));
  
  return `(${argsStr})`;
}
