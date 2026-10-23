import React, { startTransition, useState } from 'react';

interface SearchQueryInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  ref?: React.Ref<HTMLInputElement>;
  value: string;
  onChange: (query: string) => void;
}

export default function SearchQueryInput({value, onChange, ...props}: SearchQueryInputProps) {
  const [draft, setDraft] = useState(value);
  const [previousValue, setPreviousValue] = useState(value);
  if (value !== previousValue) {
    setPreviousValue(value);
    setDraft(value);
  }

  return <input {...props} value={draft} onChange={event => {
    const query = event.currentTarget.value;
    setDraft(query);
    startTransition(() => onChange(query));
  }} />;
}
