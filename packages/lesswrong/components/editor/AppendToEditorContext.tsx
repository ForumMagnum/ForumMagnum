"use client";
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

type AppendToEditorFn = (html: string) => void;

interface AppendToEditorContextValue {
  appendToEditor: AppendToEditorFn;
  registerAppendToEditor: (fn: AppendToEditorFn) => void;
}

export const AppendToEditorContext = createContext<AppendToEditorContextValue | null>(null);

export const AppendToEditorProvider = ({ children }: { children: React.ReactNode }) => {
  const [appendToEditor, setAppendToEditor] = useState<AppendToEditorFn>(() => () => {});
  const registerAppendToEditor = useCallback((fn: AppendToEditorFn) => {
    setAppendToEditor(() => fn);
  }, []);
  const contextValue = useMemo(() => ({ appendToEditor, registerAppendToEditor }), [appendToEditor, registerAppendToEditor]);
  return (
    <AppendToEditorContext.Provider value={contextValue}>
      {children}
    </AppendToEditorContext.Provider>
  );
};

export const useAppendToEditor = () => {
  const context = useContext(AppendToEditorContext);
  if (!context) {
    throw new Error("useAppendToEditor must be used within an AppendToEditorProvider");
  }
  return context;
};
