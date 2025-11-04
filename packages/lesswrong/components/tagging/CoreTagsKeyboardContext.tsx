import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CoreTagWithShortcut {
  tagId: string;
  tagName: string;
  shortcut: string;
}

type TagAction = (tag: { tagId: string, tagName: string }, existingTagIds: string[]) => Promise<void>;

interface CoreTagsKeyboardContextType {
  coreTagsWithShortcuts: CoreTagWithShortcut[];
  onTagSelected: TagAction | null;
  onTagRemoved: TagAction | null;
  registerCoreTagsKeyboard: (
    tags: CoreTagWithShortcut[],
    onSelected: TagAction,
    onRemoved: TagAction
  ) => void;
}

const CoreTagsKeyboardContext = createContext<CoreTagsKeyboardContextType | null>(null);

export function CoreTagsKeyboardProvider({ children }: { children: ReactNode }) {
  const [coreTagsWithShortcuts, setCoreTagsWithShortcuts] = useState<CoreTagWithShortcut[]>([]);
  const [onTagSelected, setOnTagSelected] = useState<TagAction | null>(null);
  const [onTagRemoved, setOnTagRemoved] = useState<TagAction | null>(null);

  const registerCoreTagsKeyboard = (
    tags: CoreTagWithShortcut[],
    onSelected: TagAction,
    onRemoved: TagAction
  ) => {
    setCoreTagsWithShortcuts(tags);
    setOnTagSelected(() => onSelected);
    setOnTagRemoved(() => onRemoved);
  };

  return (
    <CoreTagsKeyboardContext.Provider
      value={{
        coreTagsWithShortcuts,
        onTagSelected,
        onTagRemoved,
        registerCoreTagsKeyboard,
      }}
    >
      {children}
    </CoreTagsKeyboardContext.Provider>
  );
}

export function useCoreTagsKeyboard() {
  return useContext(CoreTagsKeyboardContext);
}

