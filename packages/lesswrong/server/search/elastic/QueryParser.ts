import trim from "lodash/trim";

export type QueryToken = {
  type: "should" | "must" | "not",
  token: string,
}

export type QueryParserResult = {
  tokens: QueryToken[],
  isAdvanced: boolean,
}

class QueryParser {
  private static readonly pattern = /(\w+:|-)?("[^"]*"|'[^']*'|[^\s]+)/g;

  constructor(
    private query: string,
  ) {}

  parse(): QueryParserResult {
    const query = this.query.trim();
    const tokens: QueryToken[] = [];
    let isAdvanced = false;

    for (
      let matched = QueryParser.pattern.exec(query);
      matched;
      matched = QueryParser.pattern.exec(query)
    ) {
      const prefix = matched[1];
      let token = matched[2];
      let type: QueryToken["type"] = "should";

      if (/^".+"$/.test(token)) {
        token = trim(token, '" ');
        type = "must";
        isAdvanced = true;
      } else if (/^'.+'$/.test(token)) {
        token = trim(token, "' ");
        type = "must";
        isAdvanced = true;
      }

      if (prefix === '-') {
        type = "not";
        isAdvanced = true;
      }

      tokens.push({type, token: token.replace(/[^\w\s]/g, "")});
    }

    return {tokens, isAdvanced};
  }
}

export default QueryParser;
