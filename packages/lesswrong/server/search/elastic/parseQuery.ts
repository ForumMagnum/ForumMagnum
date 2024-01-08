import trim from "lodash/trim";

export type QueryToken = {
  type: "should" | "must" | "not",
  token: string,
}

export type QueryParserResult = {
  tokens: QueryToken[],
  isAdvanced: boolean,
}

const pattern = /(\w+:|-)?("[^"]*"|'[^']*'|[^\s]+)/g;

export const parseQuery = (query: string): QueryParserResult => {
  query = query.trim();

  const tokens: QueryToken[] = [];
  let isAdvanced = false;

  for (let matched = pattern.exec(query); matched; matched = pattern.exec(query)) {
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

    // Replace dashes and underscores with spaces, and remove anything else that
    // isn't whitespace or a word
    token = token.replace(/[-_]/g, " ").replace(/[^\w\s]/g, "");

    tokens.push({type, token});
  }

  return {tokens, isAdvanced};
}
