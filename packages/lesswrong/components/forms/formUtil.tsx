import React, {useState} from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useSingle } from '../../lib/crud/withSingle';
import { useUpdate } from '../../lib/crud/withUpdate';

export interface LWForm<T> {
  loading: boolean,
  currentValue: T|null,
  updateCurrentValue: (change: Partial<T>)=>void,
}

export function Form<T>({form, children}: {form: LWForm<T>, children: React.ReactNode}) {
  return <form>
    <Components.Typography variant="body2">
      {children}
    </Components.Typography>
  </form>
}

export function useForm<N extends FragmentName, T=FragmentTypes[N]>({currentValue, updateCurrentValue, fragmentName, loading=false}: {
  currentValue: T|null,
  updateCurrentValue: (newValue: Partial<T>)=>void,
  fragmentName: N,
  loading?: boolean,
}): LWForm<T>
{
  return {
    loading,
    currentValue,
    updateCurrentValue,
  };
}

export function useFormComponentContext<FieldType,FormFragment>(form: LWForm<FormFragment>, fieldName: keyof FormFragment): {
  value: FieldType,
  setValue: (newValue: FieldType)=>void
} {
  return {
    value: form.currentValue![fieldName] as unknown as FieldType,
    setValue: (newValue: FieldType) => {
      const change = {[fieldName]: newValue} as unknown as Partial<FormFragment>;
      form.updateCurrentValue(change);
    },
  };
}

export function useAutosavingEditForm<N extends FragmentName>({documentId, collectionName, onChange, fragmentName}: {
  documentId: string,
  collectionName: CollectionNameString,
  onChange: (change: Partial<FragmentTypes[N]>)=>void,
  fragmentName: N,
}): LWForm<FragmentTypes[N]> {
  type T = FragmentTypes[N];
  const {document, loading} = useSingle({ collectionName, fragmentName, documentId });
  const {mutate, loading: loadingUpdate} = useUpdate({ collectionName, fragmentName });
  const [currentValue, setCurrentValue] = useState(document);
  
  return useForm<N>({
    loading, currentValue, fragmentName,
    updateCurrentValue: async (change: Partial<T>) => {
       setCurrentValue({...currentValue, ...change});
       await mutate({
         selector: {_id: documentId},
         data: change,
       });
       onChange(change);
    },
  });
}
