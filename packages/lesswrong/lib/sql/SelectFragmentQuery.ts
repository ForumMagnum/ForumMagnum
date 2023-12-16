import SelectQuery from "./SelectQuery";
import { getSqlFragment } from "../vulcan-lib";
import type { CodeResolverMap, PrefixGenerator } from "./ProjectionContext";
import type { GraphQLResolveInfo } from "graphql";

class SelectFragmentQuery<
  N extends CollectionNameString = CollectionNameString
> extends SelectQuery<ObjectsByCollectionName[N]> {
  private projectionArgs: unknown[];
  private codeResolvers: CodeResolverMap = {};

  constructor(
    private fragmentName: FragmentName,
    currentUser: DbUser | UsersCurrent | null,
    private resolverArgs?: Record<string, unknown> | null,
    selector?: string | MongoSelector<ObjectsByCollectionName[N]>,
    options?: MongoFindOptions<ObjectsByCollectionName[N]>,
    prefixGenerator?: PrefixGenerator,
  ) {
    const fragment = getSqlFragment(fragmentName);
    const projection = fragment.buildProjection<N>(
      currentUser,
      resolverArgs,
      prefixGenerator,
    );
    const table = projection.getCollection().getTable();
    super(table, selector, options, {
      deferInit: true,
      primaryPrefix: projection.getPrimaryPrefix(),
    });
    const {sql, args} = projection.compileQuery();
    this.atoms.push(sql);
    this.projectionArgs = args;
    this.initSelector(selector, options);
    this.codeResolvers = projection.getCodeResolvers();
  }

  private getCommentLine() {
    return `-- Fragment ${this.fragmentName}\n`;
  }

  compile() {
    const {sql, args} = super.compile(this.projectionArgs.length);
    return {
      sql: this.getCommentLine() + sql,
      args: [...this.projectionArgs, ...args],
    };
  }

  async executeCodeResolvers<T extends DbObject>(
    obj: T,
    context: ResolverContext,
    info: GraphQLResolveInfo,
    resolvers = this.codeResolvers,
  ): Promise<T> {
    const promises: Promise<unknown>[] = [];
    const subresolvers: Record<string, CodeResolverMap> = {};

    for (const resolverName in resolvers) {
      const resolver = resolvers[resolverName];
      if (typeof resolver === "function") {
        const generator = async () => {
          const result = await resolver(
            obj as AnyBecauseTodo,
            this.resolverArgs,
            context,
            info,
          );
          obj[resolverName as keyof T] = result;
        }
        promises.push(generator());
      } else {
        subresolvers[resolverName] = resolver;
      }
    }

    for (const subresolverName in subresolvers) {
      obj[subresolverName as keyof T] ??= {} as T[keyof T];
      promises.push(this.executeCodeResolvers(
        obj[subresolverName as keyof T] as DbObject,
        context,
        info,
        subresolvers[subresolverName],
      ));
    }

    await Promise.all(promises);

    return obj;
  }
}

export default SelectFragmentQuery;
