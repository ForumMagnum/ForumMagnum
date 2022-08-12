class Compiler {
  private argCount = 0;

  compile({sql, args}: Clause) {
    const result : { sql: string[], args: any[] } = { sql: [], args: [] };
    for (let i = 0; i < sql.length; ++i) {
      result.sql.push(sql[i]);
      if (i >= args.length) {
        break;
      }
      const arg = args[i];
      if (arg instanceof Clause) {
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

class Clause {
  constructor(public sql: string[] = [], public args: any[] = []) {}

  compile() {
    return new Compiler().compile(this);
  }

  static join(clauses: Clause[], separator: string, prefix = "") {
    return new Clause([prefix, ...new Array(clauses.length - 1).fill(separator)], clauses);
  }
}

export default Clause;
