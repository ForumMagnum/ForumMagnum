import React, { useEffect, useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import { SerializedEditorContents, EditorChangeEvent, deserializeEditorContents, EditorContents, nonAdminEditors, adminEditors } from './Editor';
import { useCurrentUser } from '../common/withUser';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    ...theme.typography.commentStyle,
    color: "rgba(0,0,0,.87)",
    paddingBottom: 12,
  },
  restoreLink: {
    color: theme.palette.lwTertiary.main,
  },
});

type RestorableState = {
  savedDocument: SerializedEditorContents,
}
const restorableStateHasMetadata = (savedState) => {
  return typeof savedState === "object"
}
const getRestorableState = (currentUser: UsersCurrent|null, getLocalStorageHandlers: (editorType?: string) => any): RestorableState|null => {
  const editors = currentUser?.isAdmin ? adminEditors : nonAdminEditors
  
  for (let editorType of editors) {
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

/*export const getContentsFromLocalStorage = (editorType: string): EditorContents|null => {
  const savedState = this.getLocalStorageHandlers(editorType).get();
  if (!savedState) return null;

  if (editorType === "draftJS") {
    try {
      // eslint-disable-next-line no-console
      console.log("Restoring saved document state: ", savedState);
      const contentState = convertFromRaw(savedState)
      if (contentState.hasText()) {
        return {
          draftJSValue: EditorState.createWithContent(contentState)
        };
      } else {
        // eslint-disable-next-line no-console
        console.log("Not restoring empty document state: ", contentState)
      }
    } catch(e) {
      // eslint-disable-next-line no-console
      console.error(e)
    }
    return null;
  } else {
    return {
      draftJSValue:  editorType === "draftJS"        ? savedState : null,
      markdownValue: editorType === "markdown"       ? savedState : null,
      htmlValue:     editorType === "html"           ? savedState : null,
      ckEditorValue: editorType === "ckEditorMarkup" ? savedState : null
    }
  }
}*/


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
