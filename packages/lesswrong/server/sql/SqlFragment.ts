import { getCollectionByTypeName } from "@/server/collections/allCollections";
import ProjectionContext, { CustomResolver, PrefixGenerator } from "./ProjectionContext";
import merge from "lodash/merge";

import type {
  ArgumentNode,
  FieldNode,
  FragmentDefinitionNode,
  FragmentSpreadNode,
  InlineFragmentNode,
  SelectionNode,
  SelectionSetNode,
} from "graphql";

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

function isField(node: SelectionNode): node is FieldNode {
  return node.kind === "Field";
}

function isFragmentSpread(node: SelectionNode): node is FragmentSpreadNode {
  return node.kind === "FragmentSpread";
}

function isInlineFragment(node: SelectionNode): node is InlineFragmentNode {
  return node.kind === "InlineFragment";
}

function parseArgs(args: readonly ArgumentNode[] | undefined): SqlFragmentArg[] {
  if (!args || !args.length) return [];
  const parsed: SqlFragmentArg[] = [];
  for (const arg of args) {
    const outName = arg.name.value;
    const value = arg.value;
    if (value.kind === "Variable") {
      parsed.push({ inName: value.name.value, outName });
    }
  }
  return parsed;
}

function collectFragmentSpreadDependencies(selectionSet: SelectionSetNode | undefined): string[] {
  if (!selectionSet) return [];
  const deps: string[] = [];
  for (const sel of selectionSet.selections) {
    if (isFragmentSpread(sel)) {
      deps.push(sel.name.value);
    } else if (isField(sel)) {
      deps.push(...collectFragmentSpreadDependencies(sel.selectionSet));
    } else if (isInlineFragment(sel)) {
      deps.push(...collectFragmentSpreadDependencies(sel.selectionSet));
    }
  }
  return deps;
}

export function topologicalSortAst(fragmentsByName: Record<string, FragmentDefinitionNode>): [string, string[]][] {
  const graph: Record<string, string[]> = {};
  const visited: Record<string, boolean> = {};
  const temp: Record<string, boolean> = {};
  const result: string[] = [];

  for (const name in fragmentsByName) {
    const frag = fragmentsByName[name];
    const deps = collectFragmentSpreadDependencies(frag.selectionSet).filter((dep) => !!fragmentsByName[dep]);
    graph[name] = deps;
    visited[name] = false;
  }

  function dfs(node: string) {
    if (temp[node]) {
      throw new Error(`Circular dependency detected in fragments involving "${node}"`);
    }
    if (!visited[node]) {
      temp[node] = true;
      for (const dep of graph[node] ?? []) dfs(dep);
      visited[node] = true;
      temp[node] = false;
      result.push(node);
    }
  }

  for (const name in fragmentsByName) {
    if (!visited[name]) dfs(name);
  }

  return result.map((name) => [name, graph[name] ?? []]);
}

function parseSelectionSet(
  selectionSet: SelectionSetNode,
  parsedEntriesByName: Record<string, SqlFragmentEntryMap>,
  fragmentByName: Record<string, FragmentDefinitionNode>,
): SqlFragmentEntryMap {
  let entries: SqlFragmentEntryMap = {};

  for (const selection of selectionSet.selections) {
    if (isField(selection)) {
      const name = selection.name.value;
      const args = parseArgs(selection.arguments);
      if (selection.selectionSet) {
        const subEntries = parseSelectionSet(selection.selectionSet, parsedEntriesByName, fragmentByName);
        entries[name] = merge(entries[name], {
          type: "pick",
          name,
          args,
          entries: subEntries,
        });
      } else {
        entries[name] = {
          type: "field",
          name,
          args,
        };
      }
    } else if (isFragmentSpread(selection)) {
      const fragmentName = selection.name.value;
      const spreadEntries = parsedEntriesByName[fragmentName];
      if (!spreadEntries) {
        if (!fragmentByName[fragmentName]) {
          throw new Error(`Fragment "${fragmentName}" not found`);
        }
        // If not yet parsed due to order, parse now (should be rare if we topo-sort first)
        parsedEntriesByName[fragmentName] = parseSelectionSet(
          fragmentByName[fragmentName].selectionSet,
          parsedEntriesByName,
          fragmentByName,
        );
      }
      entries = merge(entries, parsedEntriesByName[fragmentName]);
    } else if (isInlineFragment(selection)) {
      // Merge inline fragment selections into current scope
      const inlineEntries = parseSelectionSet(selection.selectionSet, parsedEntriesByName, fragmentByName);
      entries = merge(entries, inlineEntries);
    }
  }

  return entries;
}

function compileFieldEntry(
  context: ProjectionContext,
  entry: SqlFragmentField,
  baseTypeName: string,
) {
  const { name } = entry;
  const resolver = context.getResolver(name);
  if (name === "__typename") {
    // Skip - this is a fake field for Apollo's use
    return;
  }
  if (resolver) {
    if (resolver.sqlResolver) {
      const result = resolver.sqlResolver(context.getSqlResolverArgs());
      context.addProjection(name, result);
    } else {
      context.addCodeResolver(resolver.fieldName ?? name, resolver.resolver);
    }
  } else if (context.getSchema()[name]) {
    // Do nothing - native DB field will be selected by default selector
  } else {
    throw new Error(`Field "${name}" doesn't exist on "${baseTypeName}"`);
  }
}

function compilePickEntry(
  context: ProjectionContext,
  pick: SqlFragmentPick,
) {
  const { name, entries } = pick;
  const resolver = context.getResolver(name);
  if (resolver) {
    if (resolver.sqlResolver) {
      const joinCountBefore = context.getJoins().length;
      const result = resolver.sqlResolver(context.getSqlResolverArgs());
      const joins = context.getJoins();
      const didJoin = joinCountBefore < joins.length;
      if (didJoin) {
        const collection = getResolverCollection(resolver);
        const aggregate = {
          prefix: joins[joins.length - 1].prefix,
          argOffset: context.getArgs().length,
        };
        const gen = context.getPrefixGenerator();
        const subcontext = new ProjectionContext(collection, aggregate, gen);
        compileEntries(subcontext, entries, collection.typeName);
        context.aggregate(subcontext, name);
      } else {
        context.addProjection(name, result);
      }
    } else {
      context.addCodeResolver(resolver.fieldName ?? name, resolver.resolver);
    }
  } else {
    // No resolver but with subfields: treat as field
    compileFieldEntry(context, { ...pick, type: "field" }, context.getCollection().typeName);
  }
}

function compileEntries(
  context: ProjectionContext,
  entries: SqlFragmentEntryMap,
  baseTypeName: string,
) {
  if (!context.getIsAggregate()) {
    context.addProjection("*", undefined, false);
  }
  for (const entryName in entries) {
    const entry = entries[entryName];
    switch (entry.type) {
      case "field":
        compileFieldEntry(context, entry, baseTypeName);
        break;
      case "pick":
        compilePickEntry(context, entry);
        break;
    }
  }
}

export interface ParsedSqlFragment {
  name: string;
  baseTypeName: string;
  parsedEntries: SqlFragmentEntryMap;
  buildProjection: <N extends CollectionNameString = CollectionNameString>(currentUser: DbUser | UsersCurrent | null, resolverArgs?: Record<string, unknown> | null, prefixGenerator?: PrefixGenerator) => ProjectionContext<N>;
}

export function createSqlFragmentFromAst(
  resultFragmentName: string,
  fragments: FragmentDefinitionNode[],
): ParsedSqlFragment {
  const fragmentByName: Record<string, FragmentDefinitionNode> = Object.fromEntries(
    fragments.map((f) => [f.name.value, f])
  );
  const resultFragment = fragmentByName[resultFragmentName];
  if (!resultFragment) {
    throw new Error(`Fragment "${resultFragmentName}" not found`);
  }

  const baseTypeName = resultFragment.typeCondition.name.value;

  // Pre-parse dependencies in dependency order
  const parsedEntriesByName: Record<string, SqlFragmentEntryMap> = {};
  const sorted = topologicalSortAst(fragmentByName);
  for (const [name] of sorted.filter(([name]) => name !== resultFragmentName)) {
    parsedEntriesByName[name] = parseSelectionSet(
      fragmentByName[name].selectionSet,
      parsedEntriesByName,
      fragmentByName,
    );
  }

  const parsedEntries = parseSelectionSet(
    resultFragment.selectionSet,
    parsedEntriesByName,
    fragmentByName,
  );

  function buildProjection<N extends CollectionNameString = CollectionNameString>(
    currentUser: DbUser | UsersCurrent | null,
    resolverArgs?: Record<string, unknown> | null,
    prefixGenerator?: PrefixGenerator,
  ): ProjectionContext<N> {
    const collection = getCollectionByTypeName(baseTypeName);
    const context = new ProjectionContext<N>(collection, undefined, prefixGenerator);
    context.setCurrentUser(currentUser);
    context.addResolverArgs(resolverArgs ?? {});
    compileEntries(context, parsedEntries, baseTypeName);
    return context;
  }

  return {
    name: resultFragmentName,
    baseTypeName,
    parsedEntries,
    buildProjection,
  };
}
