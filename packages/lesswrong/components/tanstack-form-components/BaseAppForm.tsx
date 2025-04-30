import type { AnyFieldApi, DeepKeys, DeepValue, FieldApi, FormApi, Updater } from "@tanstack/react-form";
import React, { useMemo, useState } from "react";
import { Components } from "@/lib/vulcan-lib/components";

export type TypedFieldApi<TValue extends DeepValue<TData, keyof TData>, TData = any, TParentSubmitMeta = any> = Omit<AnyFieldApi, 'state'> & {
  name: DeepKeys<TData>;
  state: {
    value: TValue;
    meta: {
      errors: any[];
    }
  };
  handleChange: (value: Updater<TValue>) => void;
};// FieldApi<TData, keyof TData & string, TValue, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, TParentSubmitMeta>;

export type TypedFormApi<TFormData, TSubmitMeta = never> = FormApi<TFormData, any, any, any, any, any, any, any, any, TSubmitMeta>;


/**
 * TanStack's support for form-level errors on submission is worse than just rolling it ourselves, at least for now.
 */
export function useFormErrors() {
  const { FormErrors } = Components;

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
    () => <FormErrors errors={parsedErrors} getLabel={() => ''} />,
    [FormErrors, parsedErrors],
  );

  return {
    setCaughtError,
    displayedErrorComponent,
  };
}
