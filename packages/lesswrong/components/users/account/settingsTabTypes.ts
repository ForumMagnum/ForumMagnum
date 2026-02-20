import type { ReactFormExtendedApi } from '@tanstack/react-form';
import type { EditableUser } from '@/lib/collections/users/helpers';

/**
 * The form type from useForm has a complex inferred type that includes
 * withDateFields transformations and default value overrides, making it
 * incompatible with TypedReactFormApi<EditableUser> due to deep
 * contravariance in TanStack Form's FormListeners type. We use EditableUser
 * for TFormData to preserve field name typing, and `any` for all other type
 * parameters to avoid the contravariance issues. A cast is needed at the
 * call site in UsersEditForm.tsx.
 */
export type SettingsFormApi = ReactFormExtendedApi<EditableUser, any, any, any, any, any, any, any, any, any>;

export interface SettingsTabProps {
  form: SettingsFormApi;
  currentUser: UsersCurrent;
  fieldWrapperClass: string;
}
