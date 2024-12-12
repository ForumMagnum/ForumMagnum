import React, { createContext, useState } from "react";

export const TagEditorContext = createContext<{
  onOpenEditor: () => void,
  /**
   * WARNING: since `setOnOpenEditor` is a React setState function,
   * passing in a function seems to cause it to interpret it as the (prevValue: T): T => newValue form,
   * so you actually need to pass in with an additional closure if you want to update `onOpenEditor` with a new function:
   * 
   * (prevValue: T) => (): T => { ...;  return newValue; }
   */
  setOnOpenEditor: React.Dispatch<React.SetStateAction<() => void>>,
}>({
  onOpenEditor: () => {},
  setOnOpenEditor: () => {},
});

export const TagEditorProvider = ({ children }: { children: React.ReactNode }) => {
  const [onOpenEditor, setOnOpenEditor] = useState<() => void>(() => {});
  return <TagEditorContext.Provider value={{ onOpenEditor, setOnOpenEditor }}>{children}</TagEditorContext.Provider>
}
