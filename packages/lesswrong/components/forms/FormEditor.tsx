import React, {useState, useRef, useCallback} from 'react';
import { Components, registerComponent, useStyles } from '../../lib/vulcan-lib/components';
import { editableCollectionsFieldOptions } from '../../lib/editor/make_editable';
import { getLSHandlers, getLSKeyPrefix } from '../editor/localStorageHandlers'
import { useFormComponentContext, formCommonStyles, LWForm } from './formUtil';
import { Editor, EditorContents, EditorChangeEvent, getUserDefaultEditor, getBlankEditorContents, styles } from '../editor/Editor';
import { useCurrentUser } from '../common/withUser';

const formEditorStyles = (theme: ThemeType): JssStyles => ({
  ...formCommonStyles(theme),
  ...styles(theme),
});

export function FormEditor<T, FN extends keyof T>({form, fieldName, placeholder, hideControls}: {
  form: LWForm<T>,
  fieldName: NameOfFieldWithType<T,FN,RevisionEdit>,
  placeholder?: string,
  hideControls?: boolean,
}) {
  const classes = useStyles(styles, "FormEditor");
  const {value,setValue,collectionName} = useFormComponentContext<RevisionEdit,T>(form, fieldName);
  const [initialValue] = useState(value.originalContents); //FIXME: Requires conversion
  const [contents,setContents] = useState<EditorContents>(initialValue);
  const currentUser = useCurrentUser();
  const editorRef = useRef<Editor|null>(null);
  
  const initialEditorType = initialValue?.originalContents?.type || getUserDefaultEditor(currentUser); //FIXME: Requires conversion
  
  const getLocalStorageHandlers = useCallback((editorType: string) => {
    const getLocalStorageId = editableCollectionsFieldOptions[collectionName][fieldName].getLocalStorageId;
    return getLSHandlers(getLocalStorageId, document, fieldName,
      getLSKeyPrefix(editorType)
    );
  }, [collectionName, fieldName]);
  
  const onRestoreLocalStorage = useCallback((newState: EditorContents) => {
    setContents(newState);
    if (editorRef.current)
      editorRef.current.focusOnEditor();
  }, [editorRef]);
  
  const wrappedSetContents = (change: EditorChangeEvent) => {
    // TODO: Autosave
    setValue(change.contents as any); //TODO: Some conversion needed here
  }
  
  return <div className={classes.formField}>
    <Components.LocalStorageCheck
      getLocalStorageHandlers={getLocalStorageHandlers}
      onRestore={onRestoreLocalStorage}
    />
    <Components.Editor
      ref={editorRef}
      currentUser={currentUser}
      formType={"new" /*TODO*/}
      documentId={undefined /*TODO*/}
      initialEditorType={initialEditorType}
      isCollaborative={false}
      value={contents}
      onChange={()=>{} /*TODO*/}
      placeholder={placeholder}
      commentStyles={false}
      answerStyles={false}
      questionStyles={false}
      commentEditor={false}
      hideControls={false}
      maxHeight={false}
      hasCommitMessages={false}
      _classes={classes}
    />
    {!hideControls && <Components.EditorTypeSelect value={contents} setValue={wrappedSetContents}/>}
  </div>
}

registerComponent('FormEditor', FormEditor, {
  styles: formEditorStyles
});
declare global {
  interface ComponentTypes {
    FormEditor: typeof FormEditor
  }
}

