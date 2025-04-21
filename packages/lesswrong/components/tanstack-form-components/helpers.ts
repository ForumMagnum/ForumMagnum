import { AnyFormApi } from "@tanstack/react-form";
import pick from "lodash/pick";

export function getUpdatedFieldValues<T extends AnyFormApi>(formApi: T): Partial<T["state"]["values"]> {
  const updatedFieldNames = Object.entries(formApi.state.fieldMeta).filter(([key, meta]) => meta.isDirty).map(([key]) => key);
  const updatedFields = pick(formApi.state.values, updatedFieldNames);
  return updatedFields;
}
