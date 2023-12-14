import { getCollectionByTypeName } from "../vulcan-lib/getCollection";
import ProjectionContext, { CustomResolver, PrefixGenerator } from "./ProjectionContext";
import FragmentLexer from "./FragmentLexer";
import PgCollection from "./PgCollection";

type SqlFragmentArg = {
  inName: string,
  outName: string,
}

type SqlFragmentField = {
  type: "field",
  name: string,
}

type SqlFragmentSpread = {
  type: "spread",
  fragmentName: string,
}

type SqlFragmentPick = {
  type: "pick",
  name: string,
  args: SqlFragmentArg[],
  entries: SqlFragmentEntryMap,
}

type SqlFragmentEntry = SqlFragmentField | SqlFragmentSpread | SqlFragmentPick;

type SqlFragmentEntryMap = Record<string, SqlFragmentEntry>;

const getResolverCollection = (
  resolver: CustomResolver,
): PgCollection<DbObject> => {
  if (typeof resolver.type !== "string") {
    throw new Error(`Resolver "${resolver.fieldName}" has a scalar type`);
  }
  let type = resolver.type;
  const exclam = type.indexOf("!");
  if (exclam >= 0) {
    type = type.substring(0, exclam);
  }
  const collection = getCollectionByTypeName(type);
  if (!collection.isPostgres()) {
    throw new Error(`"${collection.collectionName}" is not in Postgres`);
  }
  return collection;
}

class SqlFragment {
  private lexer: FragmentLexer;

  constructor(
    /** The raw source text of the fragment */
    fragmentSrc: string,
    /**
     * A function that takes a fragment name and returns the registered SQL
     * fragment. This is taken as an argument to avoid an import cycle (DI to
     * the rescue).
     */
    private getFragment: (name: FragmentName) => SqlFragment | null,
  ) {
    this.lexer = new FragmentLexer(fragmentSrc);
  }

  getName(): string {
    return this.lexer.getName();
  }

  getBaseTypeName(): string {
    return this.lexer.getBaseTypeName();
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

  parseEntries(): SqlFragmentEntryMap {
    const entries: SqlFragmentEntryMap = {};
    let line: string | null;
    while ((line = this.lexer.next())) {
      if (line === "}") {
        break;
      }

      let match = line.match(/^[a-zA-Z0-9-_]+$/);
      if (match?.[0]) {
        const name = match[0];
        entries[name] = ({type: "field", name});
        continue;
      }

      match = line.match(/^\.\.\.([a-zA-Z0-9-_]+)$/)
      if (match?.[1]) {
        const fragmentName = match[1];
        entries[fragmentName] = {type: "spread", fragmentName};
        continue;
      }

      match = line.match(/^([a-zA-Z0-9-_]+)(\(.*\))?\s*{$/);
      if (match?.[1]) {
        const name = match[1];
        const args = match[2];
        entries[name] = {
          type: "pick",
          name,
          args: this.parseArgs(args),
          entries: this.parseEntries(),
        };
        continue;
      }

      throw new Error(`Parse error in fragment "${this.getName()}": "${line}"`);
    }
    return entries;
  }

  private compileFieldEntry(
    context: ProjectionContext,
    {name}: SqlFragmentField,
  ) {
    const resolver = context.getResolver(name);
    if (resolver) {
      if (resolver.sqlResolver) {
        const result = resolver.sqlResolver(context.getSqlResolverArgs());
        context.addProjection(name, result);
      } else {
        context.addCodeResolver(resolver.fieldName ?? name, resolver.resolver);
      }
    } else if (context.getSchema()[name]) {
      context.addProjection(name);
    } else {
      const baseTypeName = this.getBaseTypeName();
      throw new Error(`Field "${name}" doesn't exist on "${baseTypeName}"`);
    }
  }

  private compileSpreadEntry(
    context: ProjectionContext,
    spread: SqlFragmentSpread,
  ) {
    // `getFragment` takes a `FragmentName` but then checks if it's valid.
    // It should probably just be typed as taking a string but that might
    // not a be a totally safe change, so for now we'll just cast.
    const fragmentName = spread.fragmentName as FragmentName;
    const fragment = this.getFragment(fragmentName);
    if (!fragment) {
      throw new Error(`Fragment "${fragmentName}" not found`);
    }
    fragment.compileProjection(context);
  }

  private compilePickEntry(
    context: ProjectionContext,
    {name, entries}: SqlFragmentPick,
  ) {
    const resolver = context.getResolver(name);
    if (resolver) {
      if (resolver.sqlResolver) {
        // We don't care about the return value here, just the side-effect of
        // registering the necessary join. Note that we assume that only one
        // join gets registered here - it's theoretically possible that this
        // assumption wouldn't be true, but only if you do some really-deep
        // hack that bypasses the entire vulcan schema/graphql setup.
        resolver.sqlResolver(context.getSqlResolverArgs());
        const joins = context.getJoins();
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
    for (const entryName in entries) {
      const entry = entries[entryName];
      switch (entry.type) {
      case "field":
        this.compileFieldEntry(context, entry);
        break;
      case "spread":
        this.compileSpreadEntry(context, entry);
        break;
      case "pick":
        this.compilePickEntry(context, entry);
        break;
      }
    }
  }

  private compileProjection(context: ProjectionContext) {
    const entries = this.parseEntries();
    if (!this.lexer.isFinished()) {
      throw new Error(`Mismatched braces in fragment: "${this.getName()}"`);
    }
    this.compileEntries(context, entries);
  }

  buildProjection<T extends DbObject = DbObject>(
    currentUser: DbUser | UsersCurrent | null,
    resolverArgs?: Record<string, unknown> | null,
    prefixGenerator?: PrefixGenerator,
  ): ProjectionContext<T> {
    const baseTypeName = this.getBaseTypeName();
    const collection = getCollectionByTypeName(baseTypeName);
    if (!collection.isPostgres()) {
      throw new Error(`Type is not in Postgres: "${baseTypeName}"`);
    }
    const context = new ProjectionContext(collection, undefined, prefixGenerator);
    context.setCurrentUser(currentUser);
    context.addResolverArgs(resolverArgs ?? {});
    this.compileProjection(context);
    return context;
  }
}

export default SqlFragment;
