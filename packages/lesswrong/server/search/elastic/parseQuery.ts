import trim from "lodash/trim";

export type QueryToken = {
  type: "should" | "must" | "not" | "user" | "tag",
  token: string,
}

export type QueryParserResult = {
  tokens: QueryToken[],
  isAdvanced: boolean,
}

const pattern = /(\w+:|-)?("[^"]*"|'[^']*'|[^\s]+)/g;

// Curly double quotes act as ordinary quotes; Unicode dashes act as hyphens.
const normalizeQuery = (query: string): string =>
  query.trim().replace(/[\u201c\u201d\u201e]/g, '"').replace(/[\u2010\u2011\u2012\u2013\u2014]/g, "-");

export const parseQuery = (query: string): QueryParserResult => {
  query = normalizeQuery(query);

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
    } else if (prefix === "user:") {
      type = "user";
      isAdvanced = true;
    } else if (prefix === "wikitag:" || prefix === "tag:") {
      type = "tag";
      isAdvanced = true;
    }

    // Replace dashes and underscores with spaces, and remove anything else that
    // isn't whitespace, a letter, or a digit (in any script)
    if (type !== "user" && type !== "tag") {
      token = token.replace(/[-_]/g, " ").replace(/[^\p{L}\p{N}\s]/gu, "");
    }

    tokens.push({type, token});
  }

  return {tokens, isAdvanced};
}
