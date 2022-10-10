import { hasStringParam, hasBooleanParam } from "./validationHelpers";
import { pick } from "underscore";

/**
 * In general, we try to keep a single source of truth for all post data that's
 * crossposted on the original server and let the foreign server make graphql
 * requests when it needs access to this.
 *
 * Some fields have to be denormalized across sites though for various reasons -
 * these are defined here.
 */
export const denormalizedFieldKeys = [
  "draft",
  "deletedDraft",
  "title",
] as const;

export const isValidDenormalizedData = (payload: unknown): payload is DenormalizedCrosspostData =>
  hasBooleanParam(payload, "draft") &&
  hasBooleanParam(payload, "deletedDraft") &&
  hasStringParam(payload, "title");

export type DenormalizedCrosspostData = Pick<DbPost, typeof denormalizedFieldKeys[number]>;

export const extractDenormalizedData = <T extends DenormalizedCrosspostData>(data: T) =>
  pick(data, ...denormalizedFieldKeys);
