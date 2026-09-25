import React, { createContext, useContext, useMemo, useRef, useState } from "react";
import { useMutation } from "@apollo/client/react";
import { gql } from "@/lib/generated/gql-codegen";
import { type SaveStatus, useSequentialSaveQueue } from "./useSequentialSaveQueue";

export const SequenceEditorUpdateMutation = gql(`
  mutation updateSequenceSequenceEditor($selector: SelectorInput!, $data: UpdateSequenceDataInput!) {
    updateSequence(selector: $selector, data: $data) {
      data {
        ...SequencesEdit
      }
    }
  }
`);

/**
 * Lets sequence-level actions (Publish, Move to Drafts, Done editing) reach
 * the description editor's unsaved changes.
 */
export interface DescriptionDraftHandle {
  /** The unsaved description, or undefined if it hasn't changed. */
  getUnsavedContents: () => Promise<UpdateSequenceDataInput["contents"] | undefined>;
  /** Call after the unsaved description has been saved some other way. */
  markSaved: () => void;
}

interface SequenceEditorContextValue {
  sequence: SequencesEdit;
  enqueueSave: (save: () => Promise<unknown>, rollback: () => void) => void;
  drainSaves: () => Promise<void>;
  saveStatus: SaveStatus;
  /** Queues an update to the sequence's own fields. */
  updateSequence: (data: UpdateSequenceDataInput, rollback?: () => void) => void;
  descriptionDraftRef: React.MutableRefObject<DescriptionDraftHandle | null>;
  descriptionIsDirty: boolean;
  setDescriptionIsDirty: (isDirty: boolean) => void;
}

const SequenceEditorContext = createContext<SequenceEditorContextValue | null>(null);

export const SequenceEditorProvider = ({ sequence, children }: {
  sequence: SequencesEdit,
  children: React.ReactNode,
}) => {
  const { enqueue, drain, status } = useSequentialSaveQueue();
  const [updateSequenceMutation] = useMutation(SequenceEditorUpdateMutation);
  const descriptionDraftRef = useRef<DescriptionDraftHandle | null>(null);
  const [descriptionIsDirty, setDescriptionIsDirty] = useState(false);

  const value = useMemo((): SequenceEditorContextValue => ({
    sequence,
    enqueueSave: enqueue,
    drainSaves: drain,
    saveStatus: status,
    updateSequence: (data, rollback = () => {}) => enqueue(
      () => updateSequenceMutation({ variables: { selector: { _id: sequence._id }, data } }),
      rollback,
    ),
    descriptionDraftRef,
    descriptionIsDirty,
    setDescriptionIsDirty,
  }), [sequence, enqueue, drain, status, updateSequenceMutation, descriptionIsDirty]);

  return <SequenceEditorContext.Provider value={value}>
    {children}
  </SequenceEditorContext.Provider>;
};

export function useSequenceEditor(): SequenceEditorContextValue {
  const value = useContext(SequenceEditorContext);
  if (!value) {
    throw new Error("useSequenceEditor must be used inside a SequenceEditorProvider");
  }
  return value;
}
