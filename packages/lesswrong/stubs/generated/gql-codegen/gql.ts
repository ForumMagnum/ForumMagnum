import gqlTag from "graphql-tag";

function getGraphqlSource(source: string | readonly string[], substitutions: unknown[]): string {
  if (typeof source === "string") {
    return source;
  }

  let combinedSource = "";
  for (let i = 0; i < source.length; i++) {
    combinedSource += source[i];
    if (i < substitutions.length) {
      combinedSource += String(substitutions[i]);
    }
  }
  return combinedSource;
}

export function gql(source: string | readonly string[], ...substitutions: unknown[]) {
  return gqlTag(getGraphqlSource(source, substitutions));
}
