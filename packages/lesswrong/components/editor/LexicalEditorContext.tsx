"use client";

import React from 'react';

interface LexicalEditorContextValue {
  collectionName?: CollectionNameString;
  isPostEditor: boolean;
}

export const LexicalEditorContext = React.createContext<LexicalEditorContextValue>({
  collectionName: undefined,
  isPostEditor: false,
});

export const useLexicalEditorContext = (): LexicalEditorContextValue => {
  return React.useContext(LexicalEditorContext);
};
