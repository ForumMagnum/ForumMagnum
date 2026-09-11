import type { DeepKeys, DeepValue, FieldApi, FormApi, ReactFormExtendedApi, Updater } from "@tanstack/react-form";
import React, { useMemo, useState } from "react";
import { FormErrors } from "./FormErrors";

export type TypedFieldApi<TValue extends DeepValue<TData, keyof TData>, TData = any, TParentSubmitMeta = any> = Omit<FieldApi<any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, TParentSubmitMeta>, 'state'> & {
  name: DeepKeys<TData>;
  state: {
    value: TValue;
    meta: {
      errors: any[];
    }
  };
  handleChange: (value: Updater<TValue>) => void;
};

/**
 * Minimal structural subset of the field API for components that only read a
 * value and write changes back. Satisfied both by real TanStack fields and by
 * plain binding objects (e.g. the account-settings autosave bindings).
 *
 * TRead is what the component accepts when reading (wide, covering every
 * caller's field type); TWrite is exactly what the component passes to
 * handleChange (narrow, so fields with stricter value types stay assignable).
 */
export interface FieldValueBinding<TRead, TWrite = TRead> {
  state: { value: TRead };
  handleChange: (value: TWrite) => void;
}

/** Like {@link FieldValueBinding}, for components that write via `setValue`. */
export interface FieldValueSetter<TRead, TWrite = TRead> {
  state: { value: TRead };
  setValue: (value: TWrite) => void;
}

export type TypedFormApi<TFormData, TSubmitMeta = never> = FormApi<TFormData, any, any, any, any, any, any, any, any, TSubmitMeta>;

export type TypedReactFormApi<TFormData, TSubmitMeta = never> = ReactFormExtendedApi<TFormData, any, any, any, any, any, any, any, any, TSubmitMeta>;

/**
 * TanStack's support for form-level errors on submission is worse than just rolling it ourselves, at least for now.
 */
export function useFormErrors() {
  const [caughtError, setCaughtError] = useState<AnyBecauseHard>();

  const parsedErrors = useMemo(() => {
    if (!caughtError) {
      return [];
    }

    if (!caughtError.graphQLErrors) {
      return Array.isArray(caughtError) ? caughtError : [caughtError];
    }

    return caughtError.graphQLErrors;
  }, [caughtError]);

  const displayedErrorComponent = useMemo(
    () => <FormErrors errors={parsedErrors} />,
    [parsedErrors],
  );

  return {
    setCaughtError,
    displayedErrorComponent,
  };
}
