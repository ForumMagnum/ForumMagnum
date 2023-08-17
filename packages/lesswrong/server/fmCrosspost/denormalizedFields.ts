import { hasStringParam, hasBooleanParam } from "./validationHelpers";
import pick from "lodash/pick";

/**
 * In general, we try to keep a single source of truth for all post data that's
 * crossposted on the original server and let the foreign server make graphql
 * requests when it needs access to this.
 *
 * Some fields have to be denormalized across sites and these are defined here. In
 * general, a field needs to be denormalized if it's used by PostsList2 or
 * in database selectors (but these rules aren't strict).
 *
 * When adding a new field here, make sure to also update isValidDenormalizedData
 * and DenormalizedCrosspostValidator.
 */
export const denormalizedFieldKeys = [
  "draft",
  "deletedDraft",
  "title",
  "isEvent",
  "question",
  "url",
] as const;

export const isValidDenormalizedData = (payload: unknown): payload is DenormalizedCrosspostData =>
  hasBooleanParam(payload, "draft") &&
  hasBooleanParam(payload, "deletedDraft") &&
  hasStringParam(payload, "title") &&
  hasBooleanParam(payload, "isEvent") &&
  hasBooleanParam(payload, "question") &&
  hasStringParam(payload, "url");

export type DenormalizedCrosspostData = Pick<DbPost, typeof denormalizedFieldKeys[number]>;

export const extractDenormalizedData = <T extends DenormalizedCrosspostData>(data: T) =>
  pick(data, ...denormalizedFieldKeys);
