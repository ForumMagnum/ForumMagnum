import { getCollectionByTypeName } from "@/server/collections/allCollections";
import ProjectionContext, { CustomResolver, PrefixGenerator } from "./ProjectionContext";
import FragmentLexer from "./FragmentLexer";
import merge from "lodash/merge";

type SqlFragmentArg = {
  inName: string,
  outName: string,
}

/**
 * `SqlFragmentField` specifies a single named field in a GraphQL fragment
 */
type SqlFragmentField = {
  type: "field",
  name: string,
  args: SqlFragmentArg[],
}

/**
 * `SqlFragmentPick` specifies a sub-object in a fragment that contains further
 * fields "picked" from another fragment
 */
type SqlFragmentPick = {
  type: "pick",
  name: string,
  args: SqlFragmentArg[],
  entries: SqlFragmentEntryMap,
}

type SqlFragmentEntry = SqlFragmentField | SqlFragmentPick;

type SqlFragmentEntryMap = Record<string, SqlFragmentEntry>;

export const getResolverCollection = (
  resolver: CustomResolver,
): CollectionBase<CollectionNameString> => {
  if (typeof resolver.type !== "string") {
    throw new Error(`Resolver "${resolver.fieldName}" has a scalar type`);
  }
  let type = resolver.type;
  
  // Remove non-null indicator from the whole type
  type = type.replace(/!$/, '');
  
  // Handle array types
  if (type.startsWith('[') && type.endsWith(']')) {
    type = type.slice(1, -1);
  }
  
  // Remove non-null indicator from the base type
  type = type.replace(/!$/, '');

  return getCollectionByTypeName(type);
}

export function extractFragmentDefinitions(fragmentSrc: string): Record<string, string> {
  // Matches on e.g. `fragment PostsList on Post {`
  const fragmentDeclarations = fragmentSrc.matchAll(/fragment\s+([a-zA-Z0-9-_]+)\s+on\s+([a-zA-Z0-9-_]+)\s*\{/g);
  const fragments: Record<string, string> = {};
  for (const match of fragmentDeclarations) {
    const [declaration, name] = match;
    const startIndex = fragmentSrc.indexOf(declaration) + declaration.length;
    let openBraceCount = 1;
    let traversalIndex = startIndex;

    while (openBraceCount > 0) {
      const char = fragmentSrc[traversalIndex];
      if (char === '{') {
        openBraceCount++;
      } else if (char === '}') {
        openBraceCount--;
      }
      traversalIndex++;
    }

    const fragmentText = fragmentSrc.slice(startIndex - declaration.length, traversalIndex);
    fragments[name] = fragmentText;
  }
  return fragments;
}

// Build a dependency graph and perform topological sort on fragments
export function topologicalSort(fragments: Record<string, string>): [string, string[]][] {
  const graph: Record<string, string[]> = {};
  const visited: Record<string, boolean> = {};
  const temp: Record<string, boolean> = {}; // For cycle detection
  const result: string[] = [];
  
  // Build the dependency graph by finding "...FragmentName" patterns
  for (const fragmentName in fragments) {
    const fragmentBody = fragments[fragmentName];
    const dependencies: string[] = [];
    
    // Find fragment references (spread operators)
    const spreadMatches = fragmentBody.matchAll(/\.\.\.([\w]+)/g);
    for (const match of spreadMatches) {
      const dependency = match[1];
      if (fragments[dependency]) { // Only include dependencies that exist in our fragments
        dependencies.push(dependency);
      }
    }
    
    graph[fragmentName] = dependencies;
    visited[fragmentName] = false;
  }
  
  // Depth-first search for topological sorting
  function dfs(node: string): void {
    // Check for cycles
    if (temp[node]) {
      throw new Error(`Circular dependency detected in fragments involving "${node}"`);
    }
    
    if (!visited[node]) {
      temp[node] = true; // Mark as being processed
      
      // Process dependencies first
      for (const dependency of graph[node]) {
        dfs(dependency);
      }
      
      visited[node] = true;
      temp[node] = false; // Done processing
      result.push(node);
    }
  }
  
  // Run DFS for all fragments
  for (const fragmentName in fragments) {
    if (!visited[fragmentName]) {
      dfs(fragmentName);
    }
  }
  
  // Return in proper dependency order (dependencies first), with the fragment name and its dependencies
  return result.map(name => [name, graph[name]]);
}

/**
 * `SqlFragment` contains the logic for parsing GraphQL fragments into a
 * form that can be efficiently converted into SQL projections. As this is
 * relatively expensive, each fragment group is parsed only once when it is first
 * requested and the value is then memoized globally (see `allFragments.ts`).
 *
 * The man external interface here is the `buildProjection` method that
 * generates a `ProjectionContext` corresponding to a specific query with
 * specific arguments.
 */
export class SqlFragment {
  private lexer: FragmentLexer;
  private parsedEntries: SqlFragmentEntryMap | undefined;
  private sqlFragmentsByName: Record<string, SqlFragment> = {};

  constructor(
    /** The name of the fragment that represents the result of this query */
    resultFragmentName: string,
    /** The raw source text of the fragment(s), including any subfragments used by the result fragment */
    fragmentSrc: string,
  ) {
    // 1. Extract all the fragments from the source text
    const fragmentTextByName = extractFragmentDefinitions(fragmentSrc);

    // 2. Run a topological sort on the fragments to get a dependency order based on what subfragments are referenced
    const sortedFragmentNames = topologicalSort(fragmentTextByName);
    
    // 3. Parse them in order to ensure we have fragment dependencies available when we need them
    // Unfortunately we can't use a global cache keyed by fragment name because we need to be able
    // to handle clients passing in their own named fragments which might not match up with the
    // fragments we've defined ourselves.
    //
    // This is still slightly inefficient because we might parse a fragment multiple times if
    // it's referenced by multiple other fragments in the same query, but that's not a huge cost
    // and we only pay it once since we ultimately do cache the top-level "text" containing all
    // the fragments for a given query.
    for (const [fragmentName, dependencies] of sortedFragmentNames.filter(([name]) => name !== resultFragmentName)) {
      const fragmentText = fragmentTextByName[fragmentName];
      const sqlFragment = new SqlFragment(fragmentName, fragmentText);

      // Each fragment needs to have references to its dependencies for parsing entries
      const dependencySqlFragments = Object.fromEntries(dependencies.map(dep => [dep, this.sqlFragmentsByName[dep]]));
      sqlFragment.setDependencies(dependencySqlFragments);

      this.sqlFragmentsByName[fragmentName] = sqlFragment;
    }

    const resultFragmentText = fragmentTextByName[resultFragmentName];
    this.lexer = new FragmentLexer(resultFragmentText);
  }

  /**
   * The name of this fragment (eg; PostsMinimumInfo).
   */
  getName(): string {
    return this.lexer.getName();
  }

  /**
   * The GraphQL type that this fragment is defined on (eg; Post).
   */
  getBaseTypeName(): string {
    return this.lexer.getBaseTypeName();
  }

  private setDependencies(dependencies: Record<string, SqlFragment>) {
    this.sqlFragmentsByName = dependencies;
  }

  private parseArgs(argsString = ""): SqlFragmentArg[] {
    const args: SqlFragmentArg[] = [];
    const matches = argsString.matchAll(/([a-zA-Z0-9_]+)\s*:\s*\$([a-zA-Z0-9_]+)/g);
    for (const match of matches) {
      args.push({
        inName: match[2],
        outName: match[1],
      });
    }
    return args;
  }

  private parseEntries(): SqlFragmentEntryMap {
    let entries: SqlFragmentEntryMap = {};
    let line: string | null;
    while ((line = this.lexer.next())) {
      if (line === "}") {
        break;
      }

      let match = line.match(/^([a-zA-Z0-9-_]+)(\(.*\))?$/);
      if (match?.[0]) {
        const name = match[1];
        const args = match[2];
        entries[name] = {
          type: "field",
          name,
          args: this.parseArgs(args),
        };
        continue;
      }

      match = line.match(/^\.\.\.([a-zA-Z0-9_]+)$/)
      if (match?.[1]) {
        const fragmentName = match[1];
        const fragment = this.sqlFragmentsByName[fragmentName];
        if (!fragment) {
          throw new Error(`Fragment "${fragmentName}" not found`);
        }
        const fragmentEntries = fragment.getParsedEntries();
        entries = merge(entries, fragmentEntries);
        continue;
      }

      match = line.match(/^([a-zA-Z0-9-_]+)(\(.*\))?\s*{$/);
      if (match?.[1]) {
        const name = match[1];
        const args = match[2];
        entries[name] = merge(entries[name], {
          type: "pick",
          name,
          args: this.parseArgs(args),
          entries: this.parseEntries(),
        });
        continue;
      }

      throw new Error(`Parse error in fragment "${this.getName()}": "${line}"`);
    }
    return entries;
  }

  getParsedEntries(): SqlFragmentEntryMap {
    if (!this.parsedEntries) {
      this.parsedEntries = this.parseEntries();
    }
    return this.parsedEntries;
  }

  private compileFieldEntry(
    context: ProjectionContext,
    {name}: SqlFragmentField,
  ) {
    const resolver = context.getResolver(name);
    if (name === "__typename") {
      // Skip - this is a fake field for Apollo's use
    } else if (resolver) {
      if (resolver.sqlResolver) {
        const result = resolver.sqlResolver(context.getSqlResolverArgs());
        context.addProjection(name, result);
      } else {
        context.addCodeResolver(resolver.fieldName ?? name, resolver.resolver);
      }
    } else if (context.getSchema()[name]) {
      // Do nothing - this is a native DB field and will get selected by the
      // default * selector
    } else {
      const baseTypeName = this.getBaseTypeName();
      throw new Error(`Field "${name}" doesn't exist on "${baseTypeName}"`);
    }
  }

  private compilePickEntry(
    context: ProjectionContext,
    {name, entries}: SqlFragmentPick,
  ) {
    const resolver = context.getResolver(name);
    if (resolver) {
      if (resolver.sqlResolver) {
        const joinCountBefore = context.getJoins().length;
        const result = resolver.sqlResolver(context.getSqlResolverArgs());
        const joins = context.getJoins();
        const didJoin = joinCountBefore < joins.length;
        if (didJoin) {
          // We don't care about the resolver result here, just the side-effect of
          // registering the necessary join. Note that we assume that only one
          // join gets registered here - it's theoretically possible that this
          // assumption wouldn't be true, but only if you do some really-deep
          // hack that bypasses the entire vulcan schema/graphql setup.
          const collection = getResolverCollection(resolver);
          const aggregate = {
            prefix: joins[joins.length - 1].prefix,
            argOffset: context.getArgs().length,
          };
          const gen = context.getPrefixGenerator();
          const subcontext = new ProjectionContext(collection, aggregate, gen);
          this.compileEntries(subcontext, entries);
          context.aggregate(subcontext, name);
        } else {
          // If we don't add a join then just save the projection
          context.addProjection(name, result);
        }
      } else {
        context.addCodeResolver(resolver.fieldName ?? name, resolver.resolver);
      }
    } else {
      const baseTypeName = this.getBaseTypeName();
      throw new Error(`Field "${name}" on "${baseTypeName}" has no resolver`);
    }
  }

  private compileEntries(
    context: ProjectionContext,
    entries: SqlFragmentEntryMap,
  ) {
    if (!context.getIsAggregate()) {
      context.addProjection("*", undefined, false);
    }

    for (const entryName in entries) {
      const entry = entries[entryName];
      switch (entry.type) {
      case "field":
        this.compileFieldEntry(context, entry);
        break;
      case "pick":
        this.compilePickEntry(context, entry);
        break;
      }
    }
  }

  private compileProjection(context: ProjectionContext) {
    const entries = this.getParsedEntries();
    if (!this.lexer.isFinished()) {
      throw new Error(`Mismatched braces in fragment: "${this.getName()}"`);
    }
    this.compileEntries(context, entries);
  }

  buildProjection<N extends CollectionNameString = CollectionNameString>(
    currentUser: DbUser | UsersCurrent | null,
    resolverArgs?: Record<string, unknown> | null,
    prefixGenerator?: PrefixGenerator,
  ): ProjectionContext<N> {
    const baseTypeName = this.getBaseTypeName();
    const collection = getCollectionByTypeName(baseTypeName);
    const context = new ProjectionContext(collection, undefined, prefixGenerator);
    context.setCurrentUser(currentUser);
    context.addResolverArgs(resolverArgs ?? {});
    this.compileProjection(context);
    return context;
  }
}
