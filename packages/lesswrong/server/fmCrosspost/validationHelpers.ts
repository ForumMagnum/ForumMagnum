export const hasBooleanParam = (payload: unknown, param: string) =>
  payload &&
  typeof payload === "object" &&
  param in payload &&
  typeof (payload as any)[param] === "boolean";

export const hasStringParam = (payload: unknown, param: string) =>
  payload &&
  typeof payload === "object" &&
  param in payload &&
  typeof (payload as any)[param] === "string" &&
  (payload as any)[param].length;

export const hasOptionalStringParam = (payload: unknown, param: string) =>
  payload &&
  typeof payload === "object" &&
  (param in payload
    ? (
      typeof (payload as any)[param] === "string" &&
      (payload as any)[param].length
    )
    : true
  );
