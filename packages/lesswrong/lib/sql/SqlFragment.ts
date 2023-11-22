import { getCollectionByTypeName } from "../vulcan-lib/getCollection";
import ProjectionContext, { CodeResolver, CustomResolver } from "./ProjectionContext";
import FragmentLexer from "./FragmentLexer";
import Table from "./Table";

type SqlFragmentEntry = {
  type: "field",
  name: string,
} | {
  type: "spread",
  fragmentName: string,
} | {
  type: "pick",
  name: string,
  entries: SqlFragmentEntryMap,
};

type SqlFragmentEntryMap = Record<string, SqlFragmentEntry>;

type SqlFragmentSelector = {
  tableName: string,
  selectors: string[],
  args: unknown[],
  joins: SqlJoinSpec[],
  codeResolvers: Record<string, CodeResolver>,
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

      match = line.match(/^([a-zA-Z0-9-_]+)\s*{$/);
      if (match?.[1]) {
        const name = match[1];
        entries[name] = {
          type: "pick",
          name,
          entries: this.parseEntries(),
        };
        continue;
      }

      throw new Error(`Parse error in fragment "${this.getName()}": "${line}"`);
    }
    return entries;
  }

  private getCollection() {
    const baseTypeName = this.getBaseTypeName();
    const collection = getCollectionByTypeName(baseTypeName);
    if (!collection.isPostgres()) {
      throw new Error(`Type is not in Postgres: "${baseTypeName}"`);
    }
    return collection;
  }

  private getTable(): Table<DbObject> {
    return this.getCollection().table;
  }

  private getSchema() {
    const collection = this.getCollection();
    const schema = collection._schemaFields;

    const resolvers: Record<string, CustomResolver> = {};
    for (const fieldName in schema) {
      const field = schema[fieldName];
      if (field.resolveAs) {
        const resolverName = field.resolveAs.fieldName ?? fieldName;
        resolvers[resolverName] = field.resolveAs;
      }
    }

    return {schema, resolvers};
  }

  private compileSelector(context: ProjectionContext) {
    const entries = this.parseEntries();
    if (!this.lexer.isFinished()) {
      throw new Error(`Mismatched braces in fragment: "${this.getName()}"`);
    }

    const {schema, resolvers} = this.getSchema();

    for (const entryName in entries) {
      const entry = entries[entryName];
      switch (entry.type) {
        case "field": {
          const resolver = resolvers[entry.name];
          if (resolver) {
            if (resolver.sqlResolver) {
              const result = resolver.sqlResolver({
                field: context.field.bind(context),
                currentUserField: context.currentUserField.bind(context),
                join: context.addJoin.bind(context),
                arg: context.addArg.bind(context),
              });
              context.addProjection(entry.name, result);
            } else {
              context.addCodeResolver(
                resolver.fieldName ?? entry.name,
                resolver.resolver,
              );
            }
          } else if (schema[entry.name]) {
            context.addProjection(entry.name);
          } else {
            const baseTypeName = this.getBaseTypeName();
            throw new Error(`${entry.name} doesn't exist on ${baseTypeName}`);
          }
          break;
        }
        case "spread": {
          // `getFragment` takes a `FragmentName` but then checks if it's valid.
          // It should probably just be typed as taking a string but that might
          // not a be a totally safe change, so for now we'll just cast.
          const fragmentName = entry.fragmentName as FragmentName;
          const fragment = this.getFragment(fragmentName);
          if (!fragment) {
            throw new Error(`Fragment "${entry.fragmentName}" not found`);
          }
          fragment.compileSelector(context);
          break;
        }
        case "pick": {
          // TODO
          break;
        }
      }
    }
  }

  buildSelector(currentUser: DbUser | UsersCurrent | null): SqlFragmentSelector {
    const context = new ProjectionContext(this.getTable());
    context.setCurrentUser(currentUser);
    this.compileSelector(context);
    return {
      tableName: `"${context.getTable().getName()}"`,
      selectors: context.getProjections(),
      args: context.getArgs(),
      joins: context.getJoins(),
      codeResolvers: context.getCodeResolvers(),
    };
  }
}

export default SqlFragment;
