export const hasBooleanParam = (payload: unknown, param: string) =>
  payload &&
  typeof payload === "object" &&
  param in payload &&
  typeof payload[param] === "boolean";

export const hasStringParam = (payload: unknown, param: string) =>
  payload &&
  typeof payload === "object" &&
  param in payload &&
  typeof payload[param] === "string" &&
  payload[param].length;
