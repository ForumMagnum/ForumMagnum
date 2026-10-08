"use client";

import React from 'react';

interface LexicalEditorContextValue {
  collectionName?: CollectionNameString;
  isPostEditor: boolean;
  /**
   * Whether this collection supports the collaborative comment/suggestion
   * features (comment-on-selection threads in the `/comments` Yjs subdocument
   * and suggested edits as ProtonNodes in the main document).
   */
  supportsCollabComments: boolean;
}

export const LexicalEditorContext = React.createContext<LexicalEditorContextValue>({
  collectionName: undefined,
  isPostEditor: false,
  supportsCollabComments: false,
});

export const useLexicalEditorContext = (): LexicalEditorContextValue => {
  return React.useContext(LexicalEditorContext);
};
