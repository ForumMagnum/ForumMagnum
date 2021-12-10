import React, { useCallback, useRef, useEffect } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { editableCollectionsFieldOptions } from '../../lib/editor/make_editable';
import { getLSHandlers, getLSKeyPrefix } from '../async/localStorageHandlers'
import { userHasCkCollaboration, userCanCreateCommitMessages } from '../../lib/betas';
import { useCurrentUser } from '../common/withUser';
import { Editor, getUserDefaultEditor, styles } from './Editor';
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
        if (editorRef.current)
          editorRef.current?.resetEditor();
        return result;
      });
      return () => {
        cleanupSubmitForm();
        cleanupSuccessForm();
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!editorRef.current, fieldName]);
  
  const isCollaborative = userHasCkCollaboration(currentUser) && document?._id && document?.shareWithUsers && (fieldName === "contents")
  const fieldHasCommitMessages = editableCollectionsFieldOptions[collectionName][fieldName].revisionsHaveCommitMessages;
  const hasCommitMessages = fieldHasCommitMessages
    && currentUser && userCanCreateCommitMessages(currentUser)
    && (collectionName!=="Tags" || formType==="edit");
  const initialEditorType = (
    value?.originalContents?.type
    || document?.[fieldName]?.originalContents?.type
    || getUserDefaultEditor(currentUser)
  );
  const initialFieldValue = document[fieldName] || {};
  
  if (!document) return null;
  
  const actualPlaceholder = (editorHintText || hintText || placeholder || label);

  return <Components.Editor
    ref={editorRef}
    _classes={classes}
    currentUser={currentUser}
    formType={formType}
    documentId={document?._id}
    initialEditorType={initialEditorType}
    initialFieldValue={initialFieldValue}
    isCollaborative={isCollaborative}
    value={value}
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
