import React, { startTransition, useState } from 'react';

interface SearchQueryInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  ref?: React.Ref<HTMLInputElement>;
  value: string;
  onChange: (query: string) => void;
}

/** Keep typing local so rendering the search page can yield to the next keystroke. */
export default function SearchQueryInput({value, onChange, ...props}: SearchQueryInputProps) {
  const [draft, setDraft] = useState(value);
  const [previousValue, setPreviousValue] = useState(value);
  // History recall and external URL navigation still control the input.
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
