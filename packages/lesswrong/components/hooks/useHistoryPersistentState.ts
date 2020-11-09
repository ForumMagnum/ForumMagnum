import React, { useContext, useState, useCallback } from 'react';
import { useNavigation } from '../../lib/routeUtil';

export type HistoryPersistentState = any;

export const HistoryPersistentStateContext = React.createContext<HistoryPersistentState|null>(null);


export const useHistoryPersistentState = <T>(initial: T, key: string): [T, (T)=>void] => {
  const persistentState = useContext(HistoryPersistentStateContext);
  if (!persistentState) throw new Error("useHistoryPersistentState used without context provider");
  
  const {history} = useNavigation();
  const lastNavigationWasBack = history.action==="POP";
  
  let initialState = initial;
  if (lastNavigationWasBack && (key in persistentState)) {
    initialState = persistentState[key];
  }
  
  const [currentState,updateState] = useState(initialState);
  
  const storeAndUpdateState = useCallback((newState: T) => {
    updateState(newState);
    persistentState[key] = newState;
  }, [key, persistentState]);
  
  return [currentState,storeAndUpdateState];
}

