import React, { useState, useCallback, useRef, useEffect } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { editableCollectionsFieldOptions } from '../../lib/editor/make_editable';
import { getLSHandlers, getLSKeyPrefix } from '../async/localStorageHandlers'
import { userHasCkCollaboration, userCanCreateCommitMessages } from '../../lib/betas';
import { useCurrentUser } from '../common/withUser';
import { Editor, getUserDefaultEditor, getInitialEditorContents, getBlankEditorContents, EditorContents, styles } from './Editor';
import withErrorBoundary from '../common/withErrorBoundary';
import PropTypes from 'prop-types';

export const EditorFormComponent = ({form, formType, formProps, document, name, fieldName, value, hintText, placeholder, label, commentStyles, classes}: {
  form: any,
  formType: "edit"|"new",
  formProps: any,
  document: any,
  name: any,
  fieldName: any,
  value: any,
  hintText: string,
  placeholder: string,
  label: string,
  commentStyles: boolean,
  classes: ClassesType,
}, context: any) => {
  const { commentEditor, collectionName, hideControls } = (form || {});
  const { editorHintText, maxHeight } = (formProps || {});
  const currentUser = useCurrentUser();
  const editorRef = useRef<Editor|null>(null);
  
  const getLocalStorageHandlers = useCallback((editorType: string) => {
    const getLocalStorageId = editableCollectionsFieldOptions[collectionName][fieldName].getLocalStorageId;
    return getLSHandlers(getLocalStorageId, document, name,
      getLSKeyPrefix(editorType)
    );
  }, [collectionName, document, name, fieldName]);
  
  const onRestoreLocalStorage = useCallback((newState: EditorContents) => {
    // TODO
  }, []);
  
  const [contents,setContents] = useState(() => getInitialEditorContents(
    value, document, fieldName, currentUser
  ));
  const [initialEditorType] = useState(contents.type);
  
  useEffect(() => {
    if (editorRef.current) {
      const cleanupSubmitForm = context.addToSubmitForm((submission) => {
        if (editorRef.current)
          return {
            ...submission,
            [fieldName]: editorRef.current.submitData(submission)
          };
        else
          return submission;
      });
      const cleanupSuccessForm = context.addToSuccessForm((result) => {
        if (editorRef.current) {
          editorRef.current?.resetEditor();
          setContents(getBlankEditorContents(initialEditorType));
        }
        return result;
      });
      return () => {
        cleanupSubmitForm();
        cleanupSuccessForm();
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!editorRef.current, fieldName, initialEditorType]);
  
  const isCollaborative = userHasCkCollaboration(currentUser) && document?._id && document?.shareWithUsers && (fieldName === "contents")
  const fieldHasCommitMessages = editableCollectionsFieldOptions[collectionName][fieldName].revisionsHaveCommitMessages;
  const hasCommitMessages = fieldHasCommitMessages
    && currentUser && userCanCreateCommitMessages(currentUser)
    && (collectionName!=="Tags" || formType==="edit");
  
  const actualPlaceholder = (editorHintText || hintText || placeholder || label);
  
  if (!document) return null;

  return <div>
    <Components.LocalStorageCheck
      getLocalStorageHandlers={getLocalStorageHandlers}
      onRestore={onRestoreLocalStorage}
    />
    <Components.Editor
      ref={editorRef}
      _classes={classes}
      currentUser={currentUser}
      formType={formType}
      documentId={document?._id}
      initialEditorType={initialEditorType}
      isCollaborative={isCollaborative}
      value={contents}
      setValue={setContents}
      placeholder={actualPlaceholder}
      commentStyles={commentStyles}
      answerStyles={document?.answer}
      questionStyles={document?.question}
      commentEditor={commentEditor}
      hideControls={hideControls}
      maxHeight={maxHeight}
      hasCommitMessages={hasCommitMessages}
      getLocalStorageHandlers={getLocalStorageHandlers}
    />
  </div>
}

export const EditorFormComponentComponent = registerComponent('EditorFormComponent', EditorFormComponent, {
  hocs: [withErrorBoundary], styles
});

(EditorFormComponent as any).contextTypes = {
  addToSubmitForm: PropTypes.func,
  addToSuccessForm: PropTypes.func
};

declare global {
  interface ComponentTypes {
    EditorFormComponent: typeof EditorFormComponentComponent
  }
}
