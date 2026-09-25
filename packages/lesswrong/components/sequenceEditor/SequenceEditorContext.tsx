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
  /** Throws away the unsaved description's browser backup (when leaving without saving). */
  discard: () => void;
}

interface SequenceEditorContextValue {
  sequence: SequencesEdit;
  enqueueSave: (save: () => Promise<unknown>, rollback: () => void) => void;
  drainSaves: () => Promise<void>;
  saveStatus: SaveStatus;
  /** Queues an update to the sequence's own fields. */
  updateSequence: (data: UpdateSequenceDataInput, rollback?: () => void) => void;
  /**
   * Queues an update to the sequence's own fields and waits for every queued
   * save to finish. Resolves to whether this update succeeded.
   */
  saveSequenceNow: (data: UpdateSequenceDataInput) => Promise<boolean>;
  descriptionDraftRef: React.MutableRefObject<DescriptionDraftHandle | null>;
  descriptionIsDirty: boolean;
  setDescriptionIsDirty: (isDirty: boolean) => void;
}

const SequenceEditorContext = createContext<SequenceEditorContextValue | null>(null);

/**
 * Provides the editor's save queue and state to the edit-mode components.
 * With no sequence (reading mode) it provides nothing; it stays mounted so
 * that switching modes doesn't remount the page.
 */
export const SequenceEditorProvider = ({ sequence, children }: {
  sequence: SequencesEdit | null,
  children: React.ReactNode,
}) => {
  const { enqueue, drain, status } = useSequentialSaveQueue();
  const [updateSequenceMutation] = useMutation(SequenceEditorUpdateMutation);
  const descriptionDraftRef = useRef<DescriptionDraftHandle | null>(null);
  const [descriptionIsDirty, setDescriptionIsDirty] = useState(false);

  const value = useMemo((): SequenceEditorContextValue | null => {
    if (!sequence) {
      return null;
    }
    const updateSequence = (data: UpdateSequenceDataInput, rollback: () => void = () => {}) => enqueue(
      () => updateSequenceMutation({ variables: { selector: { _id: sequence._id }, data } }),
      rollback,
    );
    return {
      sequence,
      enqueueSave: enqueue,
      drainSaves: drain,
      saveStatus: status,
      updateSequence,
      saveSequenceNow: async (data) => {
        const outcome = { failed: false };
        updateSequence(data, () => { outcome.failed = true; });
        await drain();
        return !outcome.failed;
      },
      descriptionDraftRef,
      descriptionIsDirty,
      setDescriptionIsDirty,
    };
  }, [sequence, enqueue, drain, status, updateSequenceMutation, descriptionIsDirty]);

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
