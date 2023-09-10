import * as t from 'io-ts';
import pick from "lodash/pick";

/**
 * In general, we try to keep a single source of truth for all post data that's
 * crossposted on the original server and let the foreign server make graphql
 * requests when it needs access to this.
 *
 * Some fields have to be denormalized across sites and these are defined here. In
 * general, a field needs to be denormalized if it's used by PostsList2 or
 * in database selectors (but these rules aren't strict).
 */
const requiredDenormalizedFields = {
  draft: t.boolean,
  deletedDraft: t.boolean,
  title: t.string,
  isEvent: t.boolean,
  question: t.boolean,
} as const;

const optionalDenormalizedFields = {
  url: t.string,
} as const;

type RequiredKey = keyof typeof requiredDenormalizedFields;
type OptionalKey = keyof typeof optionalDenormalizedFields;
type FieldKey = RequiredKey | OptionalKey;

export const denormalizedFieldKeys: FieldKey[] = [
  ...Object.keys(requiredDenormalizedFields) as RequiredKey[],
  ...Object.keys(optionalDenormalizedFields) as OptionalKey[],
];

export const DenormalizedCrosspostValidator = t.intersection([
  t.strict(requiredDenormalizedFields),
  t.partial(optionalDenormalizedFields),
]);

export type ReadonlyDenormalizedCrosspostData = t.TypeOf<typeof DenormalizedCrosspostValidator>;

type Writeable<T> = {
  -readonly [P in keyof T]: Writeable<T[P]>;
};

export type DenormalizedCrosspostData = Writeable<ReadonlyDenormalizedCrosspostData>;

export const extractDenormalizedData = <T extends DenormalizedCrosspostData>(data: T): DenormalizedCrosspostData =>
  pick(data, ...denormalizedFieldKeys);
