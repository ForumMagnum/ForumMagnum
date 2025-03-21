import React, { useEffect, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { SerializedEditorContents, deserializeEditorContents, EditorContents, nonAdminEditors, adminEditors } from './Editor';
import { useCurrentUser } from '../common/withUser';
import { htmlToTextDefault } from '@/lib/htmlToText';
import { isFriendlyUI, preferredHeadingCase } from '@/themes/forumTheme';

const styles = (theme: ThemeType) => ({
  root: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    columnGap: isFriendlyUI ? 8 : 10,
    fontFamily: theme.typography.commentStyle.fontFamily,
    color: theme.palette.text.primaryAlert,
    fontSize: 14,
    lineHeight: '18px',
    fontWeight: '500',
    padding: '10px 8px',
    borderRadius: 4,
    backgroundColor: theme.palette.background.primaryTranslucent,
    marginBottom: 8,
    
    "& a": {
      '&:hover': {
        color: theme.palette.primary.dark,
        opacity: 1
      }
    }
  },
  restoreLink: {
    color: theme.palette.text.primaryAlert,
    whiteSpace: 'nowrap',
    paddingLeft: 6,
    paddingRight: 2,
    fontWeight: isFriendlyUI ? 600 : undefined,
  },
  restoreBody: {
    maxHeight: '1.5em',
    lineHeight: '1.5em',
    fontSize: '1.1rem',
    overflow: 'hidden',
    ...(isFriendlyUI
      ? {
        color: theme.palette.text.primaryAlert,
        fontWeight: 500,
        opacity: 0.75,
      }
      : {
        color: theme.palette.grey[500],
        padding: '0 4px',
      }),
  },
  closeIcon: {
    fontSize: 16,
    cursor: 'pointer',
    marginLeft: 'auto',
    '&:hover': {
      color: theme.palette.primary.dark,
    }
  }
});

type RestorableState = {
  savedDocument: SerializedEditorContents,
}
const restorableStateHasMetadata = (savedState: any) => {
  return typeof savedState === "object"
}
type GetLocalStorageHandlers = (editorType?: string) => any;

const getRestorableState = (currentUser: UsersCurrent|null, getLocalStorageHandlers: GetLocalStorageHandlers): RestorableState|null => {
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

const LocalStorageCheck = ({getLocalStorageHandlers, onRestore, classes, getNewPostLocalStorageHandlers, onRestoreNewPostLegacy}: {
  getLocalStorageHandlers: GetLocalStorageHandlers,
  onRestore: (newState: EditorContents) => void,
  classes: ClassesType<typeof styles>,
  getNewPostLocalStorageHandlers: GetLocalStorageHandlers,
  onRestoreNewPostLegacy: (newState: EditorContents) => void,
}) => {
  const [localStorageChecked, setLocalStorageChecked] = useState(false);
  const [restorableState, setRestorableState] = useState<{restorableState: RestorableState|null, newPostRestorableState: RestorableState|null} | null>(null);
  const currentUser = useCurrentUser();
  
  useEffect(() => {
    if (!localStorageChecked) {
      setLocalStorageChecked(true);
      const restorableState = getRestorableState(currentUser, getLocalStorageHandlers);
      const newPostRestorableState = getRestorableState(currentUser, getNewPostLocalStorageHandlers);
      setRestorableState({
        restorableState,
        newPostRestorableState,
      });
    }
  }, [localStorageChecked, getLocalStorageHandlers, getNewPostLocalStorageHandlers, currentUser]);

  const restorableDocument = restorableState?.restorableState?.savedDocument ?? null;
  const newPostRestorableDocument = restorableState?.newPostRestorableState?.savedDocument ?? null;
  
  if (!restorableDocument && !newPostRestorableDocument)
    return null;

  const displayedRestore = restorableDocument ? htmlToTextDefault(deserializeEditorContents(restorableDocument)?.value ?? '') : null;
  const legacyRestored = newPostRestorableDocument ? htmlToTextDefault(deserializeEditorContents(newPostRestorableDocument)?.value ?? '') : null;

  return <div className={classes.root}>
    <div>
      <a className={classes.restoreLink} onClick={() => {
        setRestorableState(null);
        const restored = restorableDocument ? deserializeEditorContents(restorableDocument) : null;
        const legacyRestored = newPostRestorableDocument ? deserializeEditorContents(newPostRestorableDocument) : null;
        if (restored) {
          onRestore(restored);
        } else if (legacyRestored) {
          onRestoreNewPostLegacy(legacyRestored);
        } else {
          // eslint-disable-next-line no-console
          console.error("Error restoring from localStorage");
        }
      }}>{preferredHeadingCase("Restore Autosave")}</a>
    </div>
    <div className={classes.restoreBody}> {displayedRestore || legacyRestored} </div>

    <Components.ForumIcon icon="Close" className={classes.closeIcon} onClick={() => setRestorableState(null)}/>
  </div>
}

const LocalStorageCheckComponent = registerComponent('LocalStorageCheck', LocalStorageCheck, {styles});

declare global {
  interface ComponentTypes {
    LocalStorageCheck: typeof LocalStorageCheckComponent
  }
}
