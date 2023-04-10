import React, { useEffect, useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import { SerializedEditorContents, deserializeEditorContents, EditorContents, nonAdminEditors, adminEditors } from './Editor';
import { useCurrentUser } from '../common/withUser';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    ...theme.typography.commentStyle,
    color: theme.palette.text.normal,
    
    border: theme.palette.border.normal,
    padding: 8,
    borderRadius: 4,
    backgroundColor: theme.palette.panelBackground.restoreSavedContentNotice,
    marginTop: 10,
    marginBottom: 10,
    
    "& a": {
      textDecoration: "underline",
    }
  },
  restoreLink: {
    color: theme.palette.lwTertiary.main,
  },
});

type RestorableState = {
  savedDocument: SerializedEditorContents,
}
const restorableStateHasMetadata = (savedState: any) => {
  return typeof savedState === "object"
}
const getRestorableState = (currentUser: UsersCurrent|null, getLocalStorageHandlers: (editorType?: string) => any): RestorableState|null => {
  const editors = currentUser?.isAdmin ? adminEditors : nonAdminEditors
  
  for (const editorType of editors) {
    const savedState = getLocalStorageHandlers(editorType).get();
    if (savedState) {
      if (restorableStateHasMetadata(savedState)) {
        return {
          savedDocument: savedState,
        }
      }
      return {
        savedDocument: {type: editorType, value: savedState}
      }
    }
  }
  return null;
};

const LocalStorageCheck = ({getLocalStorageHandlers, onRestore, classes}: {
  getLocalStorageHandlers: (editorType?: string) => any,
  onRestore: (newState: EditorContents)=>void,
  classes: ClassesType,
}) => {
  const [localStorageChecked, setLocalStorageChecked] = useState(false);
  const [restorableState, setRestorableState] = useState<RestorableState|null>(null);
  const currentUser = useCurrentUser();
  
  useEffect(() => {
    if (!localStorageChecked) {
      setLocalStorageChecked(true);
      setRestorableState(getRestorableState(currentUser, getLocalStorageHandlers));
    }
  }, [localStorageChecked, getLocalStorageHandlers, currentUser]);
  
  if (!restorableState)
    return null;
  
  return <div className={classes.root}>
    You have autosaved text.{" "}
    <a className={classes.restoreLink} onClick={() => {
      setRestorableState(null);
      const restored = deserializeEditorContents(restorableState.savedDocument);
      if (restored) {
        onRestore(restored);
      } else {
        // eslint-disable-next-line no-console
        console.error("Error restoring from localStorage");
      }
    }}>Restore</a>
  </div>
}

const LocalStorageCheckComponent = registerComponent('LocalStorageCheck', LocalStorageCheck, {styles});

declare global {
  interface ComponentTypes {
    LocalStorageCheck: typeof LocalStorageCheckComponent
  }
}
