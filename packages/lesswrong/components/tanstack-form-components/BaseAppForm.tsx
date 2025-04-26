import { createFormHook, createFormHookContexts, FieldApi, FormApi } from "@tanstack/react-form";
import { TanStackMuiTextField } from "./TanStackMuiTextField";

export type TypedFieldApi<TValue, TParentSubmitMeta = any> = FieldApi<any, any, TValue, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, TParentSubmitMeta>;

export type TypedFormApi<TFormData, TSubmitMeta = never> = FormApi<TFormData, any, any, any, any, any, any, any, any, TSubmitMeta>;

export const { fieldContext, formContext, useFieldContext } = createFormHookContexts();

export const { useAppForm } = createFormHook({
  fieldComponents: {
    TanStackMuiTextField,
  },
  formComponents: {},
  fieldContext,
  formContext,
});
