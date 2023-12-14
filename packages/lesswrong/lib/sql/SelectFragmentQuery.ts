import SelectQuery from "./SelectQuery";
import { getSqlFragment } from "../vulcan-lib";
import type { PrefixGenerator } from "./ProjectionContext";

class SelectFragmentQuery<T extends DbObject> extends SelectQuery<T> {
  private projectionArgs: unknown[];

  constructor(
    fragmentName: FragmentName,
    currentUser: DbUser | UsersCurrent | null,
    resolverArgs?: Record<string, unknown> | null,
    selector?: string | MongoSelector<T>,
    options?: MongoFindOptions<T>,
    prefixGenerator?: PrefixGenerator,
  ) {
    const fragment = getSqlFragment(fragmentName);
    const projection = fragment.buildProjection<T>(
      currentUser,
      resolverArgs,
      prefixGenerator,
    );
    const table = projection.getCollection().table;
    super(table, selector, options, {deferInit: true});
    const {sql, args} = projection.compileQuery();
    this.atoms.push(sql);
    this.projectionArgs = args;
    this.initSelector(selector, options);
  }

  compile() {
    const {sql, args} = super.compile(this.projectionArgs.length);
    return {
      sql,
      args: [...this.projectionArgs, ...args],
    };
  }
}

export default SelectFragmentQuery;
