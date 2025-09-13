'use client';

import React, { createContext } from 'react';
import { createContext as contextSelectorCreateContext } from "use-context-selector";
import type { EditorContents } from '../editor/Editor';

interface DynamicTableOfContentsContextType {
  setToc: (document: EditorContents) => void;
}

type AutosaveFunc = () => Promise<void>;
interface AutosaveEditorStateContext {
  autosaveEditorState: AutosaveFunc | null;
  /**
   * WARNING: since `setAutosaveEditorState` is a React setState function,
   * passing in a function seems to cause it to interpret it as the (prevValue: T): T => newValue form,
   * so you actually need to pass in with an additional closure if you want to update `autosaveEditorState` with a new function:
   *
   * (prevValue: T) => (): T => { ...;  return newValue; }
   */
  setAutosaveEditorState: React.Dispatch<React.SetStateAction<AutosaveFunc | null>>;
}

type DisableNoKibitzContextType = { disableNoKibitz: boolean; setDisableNoKibitz: (disableNoKibitz: boolean) => void; };

export const TimezoneContext = createContext<string | null>(null);
export const UserContext = contextSelectorCreateContext<UsersCurrent|null>(null);
export const DynamicTableOfContentsContext = createContext<DynamicTableOfContentsContextType | null>(null);
export const AutosaveEditorStateContext = React.createContext<AutosaveEditorStateContext>({
  autosaveEditorState: null,
  setAutosaveEditorState: _ => { },
});
export const DisableNoKibitzContext = createContext<DisableNoKibitzContextType>({ disableNoKibitz: false, setDisableNoKibitz: () => { } });

// RelevantTestGroupAllocation: A dictionary from the names of A/B tests to
// which group a user is in, which is pruned to only the tests which affected
// a particular page render.
export type RelevantTestGroupAllocation = Record<string,string>

// Used for tracking which A/B test groups were relevant to the page rendering
export const ABTestGroupsUsedContext = React.createContext<RelevantTestGroupAllocation>({});
