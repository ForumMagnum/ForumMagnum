import { useCallback, useMemo, useState } from "react";

export type MultiSelectOption = {
  value: string,
  label: string,
}

export type MultiSelectProps = {
  title: string,
  options: MultiSelectOption[],
}

export type MultiSelectState = MultiSelectOption & {
  selected: boolean,
  onToggle: () => void,
}

export type MultiSelectResult = {
  title: string,
  state: MultiSelectState[],
  selectedValues: string[],
  clear: () => void,
  summary: string,
}

export const buildMultiSelectSummary = (
  title: string,
  options: MultiSelectOption[],
  selected: string[],
): string => {
  if (selected.length === 0) {
    return title;
  }
  if (selected.length === 1) {
    const label = options.find(({value}) => value === selected[0])?.label;
    return label ? `${title}: ${label}` : title;
  }
  return `${title}: ${selected.length}`;
}

export const useMultiSelect = ({
  title,
  options,
}: MultiSelectProps): MultiSelectResult => {
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
    title,
    state,
    selectedValues: selected,
    clear,
    summary: buildMultiSelectSummary(title, options, selected),
  };
}
