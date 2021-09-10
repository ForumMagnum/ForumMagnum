import React, { useCallback, useRef, useEffect } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { editableCollectionsFieldOptions } from '../../lib/editor/make_editable';
import { getLSHandlers } from '../async/localStorageHandlers'
import { userHasCkCollaboration, userCanCreateCommitMessages } from '../../lib/betas';
import { useCurrentUser } from '../common/withUser';
import { Editor, getUserDefaultEditor } from './Editor';
import withErrorBoundary from '../common/withErrorBoundary';
import PropTypes from 'prop-types';

export const EditorFormComponent = ({form, formType, formProps, document, name, fieldName, value, hintText, placeholder, label, commentStyles}: {
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
}, context: any) => {
  const { commentEditor, collectionName, hideControls } = (form || {});
  const { editorHintText, maxHeight } = (formProps || {});
  const currentUser = useCurrentUser();
  const editorRef = useRef<Editor|null>(null);
  
  // Get an editor-type-specific prefix to use on localStorage keys, to prevent
  // drafts written with different editors from having conflicting names.
  const getLSKeyPrefix = (editorType: string): string => {
    switch(editorType) {
      default:
      case "draftJS":  return "";
      case "markdown": return "md_";
      case "html":     return "html_";
      case "ckEditorMarkup": return "ckeditor_";
    }
  }

  const getLocalStorageHandlers = useCallback((editorType: string) => {
    const getLocalStorageId = editableCollectionsFieldOptions[collectionName][fieldName].getLocalStorageId;
    return getLSHandlers(getLocalStorageId, document, name,
      getLSKeyPrefix(editorType)
    );
  }, [collectionName, document, name, fieldName]);
  
  useEffect(() => {
    if (editorRef.current) {
      context.addToSubmitForm((submission) => {
        if (editorRef.current)
          return {
            ...submission,
            [fieldName]: editorRef.current.submitData(submission)
          };
        else
          return submission;
      });
      context.addToSuccessForm((result) => {
        if (editorRef.current)
          editorRef.current?.resetEditor();
        return result;
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorRef.current, context.addToSubmitForm, context.addToSuccessForm, fieldName]);
  
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

  return <Components.Editor
    ref={editorRef}
    formType={formType}
    documentId={document?._id}
    initialEditorType={initialEditorType}
    initialFieldValue={initialFieldValue}
    isCollaborative={isCollaborative}
    value={value}
    hintText={hintText}
    placeholder={placeholder}
    label={label}
    commentStyles={commentStyles}
    answerStyles={document?.answer}
    questionStyles={document?.question}
    commentEditor={commentEditor}
    hideControls={hideControls}
    editorHintText={editorHintText}
    maxHeight={maxHeight}
    hasCommitMessages={hasCommitMessages}
    getLocalStorageHandlers={getLocalStorageHandlers}
  />
}

export const EditorFormComponentComponent = registerComponent('EditorFormComponent', EditorFormComponent, {
  hocs: [withErrorBoundary],
  areEqual: "auto",
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
