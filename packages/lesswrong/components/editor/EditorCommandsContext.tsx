import React, { createContext, useContext, useState, ReactNode, useMemo } from "react";

type GetLlmFeedbackCommand = (userPrompt: string, sourceId: string) => Promise<void>;
type CancelLlmFeedbackCommand = () => void;

export type EditorCommandsContextType = {
  getLlmFeedbackCommand: GetLlmFeedbackCommand | null;
  setGetLlmFeedbackCommand: React.Dispatch<React.SetStateAction<GetLlmFeedbackCommand | null>>;
  cancelLlmFeedbackCommand: CancelLlmFeedbackCommand | null;
  setCancelLlmFeedbackCommand: React.Dispatch<React.SetStateAction<CancelLlmFeedbackCommand | null>>;
  llmFeedbackCommandLoadingSourceId: string | null;
  setLlmFeedbackCommandLoadingSourceId: React.Dispatch<React.SetStateAction<string | null>>;
}

const EditorCommandsContext = createContext<EditorCommandsContextType|null>(null);

export const useEditorCommands = (): EditorCommandsContextType => {
  const result = useContext(EditorCommandsContext);
  if (!result) throw new Error("useEditorCommands called but not a descendent of EditorCommandsContextProvider");

  return result;
}

export const EditorCommandsContextProvider = ({ children }: { children: ReactNode }) => {
  const [getLlmFeedbackCommand, setGetLlmFeedbackCommand] = useState<GetLlmFeedbackCommand | null>(null);
  const [cancelLlmFeedbackCommand, setCancelLlmFeedbackCommand] = useState<CancelLlmFeedbackCommand | null>(null);
  const [llmFeedbackCommandLoadingSourceId, setLlmFeedbackCommandLoadingSourceId] = useState<string | null>(null);

  const providedContext: EditorCommandsContextType = useMemo(() => ({
    getLlmFeedbackCommand,
    setGetLlmFeedbackCommand,
    cancelLlmFeedbackCommand,
    setCancelLlmFeedbackCommand,
    llmFeedbackCommandLoadingSourceId,
    setLlmFeedbackCommandLoadingSourceId,
  }), [getLlmFeedbackCommand, setGetLlmFeedbackCommand, cancelLlmFeedbackCommand, setCancelLlmFeedbackCommand, llmFeedbackCommandLoadingSourceId, setLlmFeedbackCommandLoadingSourceId]);

  return <EditorCommandsContext.Provider value={providedContext}>{children}</EditorCommandsContext.Provider>
}
