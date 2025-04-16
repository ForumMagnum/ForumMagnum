import { createFormHook, createFormHookContexts, FieldApi } from "@tanstack/react-form";
import { TanStackMuiTextField } from "./TanStackMuiTextField";

export type TypedFieldApi<TValue> = FieldApi<any, any, TValue, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any>;

export const { fieldContext, formContext, useFieldContext } = createFormHookContexts();

export const { useAppForm } = createFormHook({
  fieldComponents: {
    TanStackMuiTextField,
  },
  formComponents: {},
  fieldContext,
  formContext,
});
