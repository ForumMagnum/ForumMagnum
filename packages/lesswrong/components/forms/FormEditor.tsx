import React, {useState, useRef, useCallback} from 'react';
import { Components, registerComponent, useStyles } from '../../lib/vulcan-lib/components';
import { editableCollectionsFieldOptions } from '../../lib/editor/make_editable';
import { getLSHandlers, getLSKeyPrefix } from '../async/localStorageHandlers'
import { useFormComponentContext, formCommonStyles, LWForm } from './formUtil';
import { Editor, getUserDefaultEditor, styles } from '../editor/Editor';
import { useCurrentUser } from '../common/withUser';

const formEditorStyles = (theme: ThemeType): JssStyles => ({
  ...formCommonStyles(theme),
  ...styles(theme),
});

export function FormEditor<T, FN extends keyof T>({form, fieldName, placeholder}: {
  form: LWForm<T>,
  fieldName: NameOfFieldWithType<T,FN,RevisionEdit>,
  placeholder?: string,
}) {
  const classes = useStyles(styles, "FormEditor");
  const {value,setValue,collectionName} = useFormComponentContext<RevisionEdit,T>(form, fieldName);
  const [initialValue] = useState(value);
  const currentUser = useCurrentUser();
  const editorRef = useRef<Editor|null>(null);
  
  const initialEditorType = initialValue?.originalContents?.type || getUserDefaultEditor(currentUser);
  
  const getLocalStorageHandlers = useCallback((editorType: string) => {
    const getLocalStorageId = editableCollectionsFieldOptions[collectionName][fieldName].getLocalStorageId;
    return getLSHandlers(getLocalStorageId, document, fieldName,
      getLSKeyPrefix(editorType)
    );
  }, [collectionName, document, fieldName]);
  
  return <div className={classes.formField}>
    <Components.Editor
      ref={editorRef}
      currentUser={currentUser}
      formType="new"
      documentId={undefined /*TODO*/}
      initialEditorType={initialEditorType}
      initialFieldValue={initialValue}
      isCollaborative={false}
      value={null /*TODO*/}
      placeholder={placeholder}
      commentStyles={false}
      answerStyles={false}
      questionStyles={false}
      commentEditor={false}
      hideControls={false}
      maxHeight={false}
      hasCommitMessages={false}
      getLocalStorageHandlers={getLocalStorageHandlers}
      _classes={classes}
    />
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

