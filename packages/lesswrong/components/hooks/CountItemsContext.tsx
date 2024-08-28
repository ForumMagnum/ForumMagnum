import React, {
  ReactNode,
  MutableRefObject,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";

type CountItemsContext = {
  addItems: (count: number) => void,
  items: MutableRefObject<number>,
}

const countItemsContext = createContext<CountItemsContext | null>(null);

export const CountItemsContextProvider = ({children}: {children: ReactNode}) => {
  const items = useRef(0);

  const addItems = useCallback((count: number) => {
    items.current += count;
  }, []);

  useEffect(() => {
    items.current = 0;
  });

  return (
    <countItemsContext.Provider value={{
      addItems,
      items,
    }}>
      {children}
    </countItemsContext.Provider>
  );
}

export const useCountItemsContext = () => useContext(countItemsContext);
