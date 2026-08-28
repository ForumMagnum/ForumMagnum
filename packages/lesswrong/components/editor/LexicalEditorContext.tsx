"use client";

import React from 'react';

interface LexicalEditorContextValue {
  collectionName?: CollectionNameString;
  /** The _id of the document being edited, when it already exists. */
  documentId?: string | null;
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
  documentId: null,
  isPostEditor: false,
  supportsCollabComments: false,
});

export const useLexicalEditorContext = (): LexicalEditorContextValue => {
  return React.useContext(LexicalEditorContext);
};
