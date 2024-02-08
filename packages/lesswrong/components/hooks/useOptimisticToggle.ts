import { useCallback, MouseEvent, useState, useEffect } from "react";

export const useOptimisticToggle = (
  actualValue: boolean,
  toggle: (e: MouseEvent<HTMLDivElement>) => void,
): [boolean, (e: MouseEvent<HTMLDivElement>) => void] => {
  const [optimisticValue, setOptimisticValue] = useState(actualValue);

  const toggleValue = useCallback((e: MouseEvent<HTMLDivElement>) => {
    setOptimisticValue((value) => !value);
    toggle(e);
  }, [toggle]);

  useEffect(() => {
    setOptimisticValue(actualValue);
  }, [actualValue]);

  return [
    optimisticValue,
    toggleValue,
  ];
}
