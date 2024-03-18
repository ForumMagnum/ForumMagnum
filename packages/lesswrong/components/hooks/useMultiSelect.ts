import { useCallback, useMemo, useState } from "react";

export type MultiSelectOption = {
  value: string,
  label: string,
}

export type MultiSelectState = MultiSelectOption & {
  selected: boolean,
  onToggle: () => void,
}

export type MultiSelectResult = {
  state: MultiSelectState[],
  selectedValues: string[],
  clear: () => void,
}

export const useMultiSelect = (options: MultiSelectOption[]): MultiSelectResult => {
  const [selected, setSelected] = useState<string[]>([]);

  const onToggle = useCallback((value: string) => {
    setSelected((selected) => {
      const values = new Set(selected);
      if (values.has(value)) {
        values.delete(value);
      } else {
        values.add(value);
      }
      return Array.from(values);
    });
  }, []);

  const state = useMemo(() => options.map((option) => ({
    ...option,
    selected: selected.indexOf(option.value) >= 0,
    onToggle: onToggle.bind(null, option.value),
  })), [options, selected, onToggle]);

  const clear = useCallback(() => {
    setSelected([]);
  }, []);

  return {
    state,
    selectedValues: selected,
    clear,
  };
}
