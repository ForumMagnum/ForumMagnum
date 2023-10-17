import pick from "lodash/pick";
import { DenormalizedCrosspostData, optionalDenormalizedFields, requiredDenormalizedFields } from './types';

type RequiredKey = keyof typeof requiredDenormalizedFields;
type OptionalKey = keyof typeof optionalDenormalizedFields;
type FieldKey = RequiredKey | OptionalKey;

export const denormalizedFieldKeys: FieldKey[] = [
  ...Object.keys(requiredDenormalizedFields) as RequiredKey[],
  ...Object.keys(optionalDenormalizedFields) as OptionalKey[],
];

export const extractDenormalizedData = <T extends DenormalizedCrosspostData>(data: T): DenormalizedCrosspostData =>
  pick(data, ...denormalizedFieldKeys);
