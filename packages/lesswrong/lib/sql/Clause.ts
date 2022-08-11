class Compiler {
  private argCount = 0;

  compile({sql, args}: SqlClause) {
    const result : { sql: string[], args: any[] } = { sql: [], args: [] };
    for (let i = 0; i < sql.length; ++i) {
      result.sql.push(sql[i]);
      if (i >= args.length) {
        break;
      }
      const arg = args[i];
      if (arg instanceof SqlClause) {
        const subclause = this.compile(arg);
        result.sql.push(subclause.sql);
        result.args = result.args.concat(subclause.args);
      } else {
        result.sql.push(`$${++this.argCount}`);
        result.args += arg;
      }
    }
    return { sql: result.sql.join(" "), args: result.args };
  }
}

class SqlClause {
  constructor(public sql: string[] = [], public args: any[] = []) {}

  compile() {
    return new Compiler().compile(this);
  }
}

export default SqlClause
