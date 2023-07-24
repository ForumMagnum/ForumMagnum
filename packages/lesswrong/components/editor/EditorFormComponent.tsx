import React, { useState, useCallback, useRef, useEffect } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { debateEditorPlaceholder, defaultEditorPlaceholder, editableCollectionsFieldOptions, linkpostEditorPlaceholder, questionEditorPlaceholder } from '../../lib/editor/make_editable';
import { getLSHandlers, getLSKeyPrefix } from './localStorageHandlers'
import { userCanCreateCommitMessages } from '../../lib/betas';
import { useCurrentUser } from '../common/withUser';
import { Editor, EditorChangeEvent, getUserDefaultEditor, getInitialEditorContents,
  getBlankEditorContents, EditorContents, isBlank, serializeEditorContents,
  EditorTypeString, styles, FormProps, shouldSubmitContents } from './Editor';
import withErrorBoundary from '../common/withErrorBoundary';
import PropTypes from 'prop-types';
import * as _ from 'underscore';
import { gql, useLazyQuery } from '@apollo/client';
import { useUpdate } from "../../lib/crud/withUpdate";
import { isEAForum } from '../../lib/instanceSettings';
import Transition from 'react-transition-group/Transition';
import { useTracking } from '../../lib/analyticsEvents';
import { PostCategory } from '../../lib/collections/posts/helpers';

const autosaveInterval = 3000; //milliseconds

export function isCollaborative(post: DbPost, fieldName: string): boolean {
  if (!post) return false;
  if (!post._id) return false;
  if (fieldName !== "contents") return false;
  if (post.shareWithUsers) return true;
  if (post.sharingSettings?.anyoneWithLinkCan && post.sharingSettings.anyoneWithLinkCan !== "none")
    return true;
  return false;
}

const getPostPlaceholder = (post: PostsBase) => {
  const { question, postCategory } = post;
  const effectiveCategory = question ? "question" as const : postCategory as PostCategory;

  if (post.debate) return debateEditorPlaceholder;
  if (effectiveCategory === "question") return questionEditorPlaceholder;
  if (effectiveCategory === "linkpost") return linkpostEditorPlaceholder;
  return defaultEditorPlaceholder;
}

export const EditorFormComponent = ({form, formType, formProps, document, name, fieldName, value, hintText, placeholder, label, commentStyles, classes}: {
  form: any,
  formType: "edit"|"new",
  formProps: FormProps,
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
  const { updateCurrentValues } = context;
  const currentUser = useCurrentUser();
  const editorRef = useRef<Editor|null>(null);
  const hasUnsavedDataRef = useRef({hasUnsavedData: false});
  const isCollabEditor = isCollaborative(document, fieldName);
  const { captureEvent } = useTracking()
  
  const getLocalStorageHandlers = useCallback((editorType: EditorTypeString) => {
    const getLocalStorageId = editableCollectionsFieldOptions[collectionName as CollectionNameString][fieldName].getLocalStorageId;
    return getLSHandlers(getLocalStorageId, document, name,
      getLSKeyPrefix(editorType)
    );
  }, [collectionName, document, name, fieldName]);
  
  const [contents,setContents] = useState(() => getInitialEditorContents(
    value, document, fieldName, currentUser
  ));
  const [initialEditorType] = useState(contents.type);
  
  const defaultEditorType = getUserDefaultEditor(currentUser);
  const currentEditorType = contents.type || defaultEditorType;

  // We used to show this warning to a variety of editor types, but now we only want
  // to show it to people using the html editor. Converting from markdown to ckEditor
  // is error prone and we don't want to encourage it. We no longer support draftJS
  // but some old posts still are using it so we show the warning for them too.
  const showEditorWarning = (formType !== "new") && (currentEditorType === 'html' || currentEditorType === 'draftJS')
  
  // On the EA Forum, our bot checks if posts are potential criticism,
  // and if so we show a little card with tips on how to make it more likely to go well.
  const [postFlaggedAsCriticism, setPostFlaggedAsCriticism] = useState<boolean>(false)
  const [criticismTipsDismissed, setCriticismTipsDismissed] = useState<boolean>(document.criticismTipsDismissed)

  const { mutate: updatePostCriticismTips } = useUpdate({
    collectionName: "Posts",
    fragmentName: "PostsEditCriticismTips",
  })
  const handleDismissCriticismTips = () => {
    // hide the card
    setCriticismTipsDismissed(true)
    captureEvent('criticismTipsDismissed', {postId: document._id})
    // make sure not to show the card for this post ever again
    updateCurrentValues({criticismTipsDismissed: true})
    if (formType !== 'new' && document._id) {
      void updatePostCriticismTips({
        selector: {_id: document._id},
        data: {
          criticismTipsDismissed: true
        }
      })
    }
  }
  
  const [checkPostIsCriticism] = useLazyQuery(gql`
    query getPostIsCriticism($args: JSON) {
      PostIsCriticism(args: $args)
    }
    `, {
      onCompleted: (data) => {
        const isCriticism = !!data.PostIsCriticism
        setPostFlaggedAsCriticism(isCriticism)
        if (isCriticism && !postFlaggedAsCriticism) {
          captureEvent('criticismTipsShown', {postId: document._id})
        }
      }
    }
  )
  
  // On the EA Forum, our bot checks if posts are potential criticism,
  // and if so we show a little card with tips on how to make it more likely to go well.
  const checkIsCriticism = useCallback((contents: EditorContents) => {
    // we're currently skipping linkposts, since the linked post's author is
    // not always the same person posting it on the forum
    if (
      !isEAForum ||
      collectionName !== 'Posts' ||
      document.isEvent ||
      document.debate ||
      document.shortform ||
      document.url ||
      criticismTipsDismissed
    ) return

    checkPostIsCriticism({variables: { args: {
      title: document.title ?? '',
      contentType: contents.type,
      body: contents.value
    }}})
  }, [
    collectionName,
    document.isEvent,
    document.debate,
    document.shortform,
    document.url,
    document.title,
    criticismTipsDismissed,
    checkPostIsCriticism
  ])

  // Run this check up to once per 20 min.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const throttledCheckIsCriticism = useCallback(_.throttle(checkIsCriticism, 1000*60*20), [])
  // Run this check up to once per 2 min (called only when there is a significant amount of text added).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const throttledCheckIsCriticismLargeDiff = useCallback(_.throttle(checkIsCriticism, 1000*60*2), [])
  
  useEffect(() => {
    // check when loading the post edit form
    if (contents?.value?.length > 300) {
      throttledCheckIsCriticism(contents)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  
  const saveBackup = useCallback((newContents: EditorContents) => {
    if (isBlank(newContents)) {
      getLocalStorageHandlers(currentEditorType).reset();
      hasUnsavedDataRef.current.hasUnsavedData = false;
    } else {
      const serialized = serializeEditorContents(newContents);
      const success = getLocalStorageHandlers(newContents.type).set(serialized);
      
      if (success) {
        hasUnsavedDataRef.current.hasUnsavedData = false;
      }
    }
  }, [getLocalStorageHandlers, currentEditorType]);

  /**
   * Update the edited field (e.g. "contents") so that other form components can access the updated value. The direct motivation for this
   * was for SocialPreviewUpload, which needs to know the body of the post in order to generate a preview description and image.
   */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const throttledSetContentsValue = useCallback(_.throttle(async () => {
    if (!(editorRef.current && shouldSubmitContents(editorRef.current))) return
    
    // Preserve other fields in "contents" which may have been sent from the server
    updateCurrentValues({[fieldName]: {...(document[fieldName] || {}), ...(await editorRef.current.submitData())}})
  }, autosaveInterval, {leading: true}), [autosaveInterval])
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const throttledSaveBackup = useCallback(
    _.throttle(saveBackup, autosaveInterval, {leading: false}),
    [saveBackup, autosaveInterval]
  );
  
  const wrappedSetContents = useCallback((change: EditorChangeEvent) => {
    const {contents: newContents, autosave} = change;
    setContents(newContents);
    
    // Only save to localStorage if not using collaborative editing, since with
    // collaborative editing stuff is getting constantly sent through a
    // websocket and saved that way.
    if (!isCollabEditor) {
      if (!isBlank(newContents)) {
        hasUnsavedDataRef.current.hasUnsavedData = true;
      }
    }
    
    // Hack: Fill in ${fieldName}_type with the editor type on every keystroke, to enable other
    // form components (in particular PostSharingSettings) to check whether we're
    // using CkEditor vs draftjs vs etc. Update the actual contents with a throttled
    // callback to improve performance. Note that the contents are always recalculated on
    // submit anyway, setting them here is only for the benefit of other form components (e.g. SocialPreviewUpload)
    updateCurrentValues({[`${fieldName}_type`]: newContents?.type});
    void throttledSetContentsValue()
    
    if (autosave) {
      throttledSaveBackup(newContents);
    }
    
    // We only check posts that have >300 characters, which is ~a few sentences.
    if (newContents?.value?.length > 300) {
      // If there's a lot more text (ex. something pasted in), we check the post sooner.
      if (newContents.value.length - (contents?.value?.length ?? 0) > 300) {
        throttledCheckIsCriticismLargeDiff(newContents)
      } else {
        throttledCheckIsCriticism(newContents)
      }
    }
  }, [isCollabEditor, updateCurrentValues, fieldName, throttledSetContentsValue, throttledSaveBackup, contents, throttledCheckIsCriticismLargeDiff, throttledCheckIsCriticism]);
  
  useEffect(() => {
    const unloadEventListener = (ev: BeforeUnloadEvent) => {
      if (hasUnsavedDataRef?.current?.hasUnsavedData) {
        ev.preventDefault();
        ev.returnValue = 'Are you sure you want to close?';
        return ev.returnValue
      }
    };
    
    window.addEventListener("beforeunload", unloadEventListener);
    return () => {
      window.removeEventListener("beforeunload", unloadEventListener);
    };
  }, [fieldName, hasUnsavedDataRef]);
  
  const onRestoreLocalStorage = useCallback((newState: EditorContents) => {
    wrappedSetContents({contents: newState, autosave: false});
    // TODO: Focus editor
  }, [wrappedSetContents]);
  
  useEffect(() => {
    if (editorRef.current) {
      const cleanupSubmitForm = context.addToSubmitForm(async (submission: any) => {
        if (editorRef.current && shouldSubmitContents(editorRef.current))
          return {
            ...submission,
            [fieldName]: await editorRef.current.submitData()
          };
        else
          return submission;
      });
      const cleanupSuccessForm = context.addToSuccessForm((result: any, form: any, submitOptions: any) => {
        getLocalStorageHandlers(currentEditorType).reset();
        if (editorRef.current && !submitOptions?.redirectToEditor) {
          wrappedSetContents({
            contents: getBlankEditorContents(initialEditorType),
            autosave: false,
          });
        }
        return result;
      });
      return () => {
        cleanupSubmitForm();
        cleanupSuccessForm();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!editorRef.current, fieldName, initialEditorType, context.addToSuccessForm, context.addToSubmitForm]);
  
  const fieldHasCommitMessages = editableCollectionsFieldOptions[collectionName as CollectionNameString][fieldName].revisionsHaveCommitMessages;
  const hasCommitMessages = fieldHasCommitMessages
    && currentUser && userCanCreateCommitMessages(currentUser)
    && (collectionName!=="Tags" || formType==="edit");

  const actualPlaceholder = ((collectionName === "Posts" && getPostPlaceholder(document)) || editorHintText || hintText || placeholder);

  // The logic here is to make sure that the placeholder is updated when it changes in the props.
  // CKEditor can't change the placeholder after it's been initialized, so we need to change the key
  // to force it to unmount and remount the whole component. Only do this where there are no contents,
  // as this is the only time the placeholder is visible.
  const placeholderKey = useRef(actualPlaceholder);
  if (placeholderKey.current !== actualPlaceholder && !contents?.value) {
    placeholderKey.current = actualPlaceholder;
  }

  // document isn't necessarily defined. TODO: clean up rest of file
  // to not rely on document
  if (!document) return null;
    
  return <div className={classes.root}>
    {showEditorWarning &&
      <Components.LastEditedInWarning
        initialType={initialEditorType}
        currentType={contents.type}
        defaultType={defaultEditorType}
        value={contents} setValue={wrappedSetContents}
      />
    }
    {!isCollabEditor &&<Components.LocalStorageCheck
      getLocalStorageHandlers={getLocalStorageHandlers}
      onRestore={onRestoreLocalStorage}
    />}
    <Components.Editor
      key={placeholderKey.current}
      ref={editorRef}
      _classes={classes}
      currentUser={currentUser}
      label={label}
      formType={formType}
      documentId={document._id}
      collectionName={collectionName}
      fieldName={fieldName}
      initialEditorType={initialEditorType}
      formProps={formProps}
      isCollaborative={isCollabEditor}
      accessLevel={document.myEditorAccess}
      value={contents}
      onChange={wrappedSetContents}
      placeholder={actualPlaceholder}
      commentStyles={commentStyles}
      answerStyles={document.answer}
      questionStyles={document.question}
      commentEditor={commentEditor}
      hideControls={hideControls}
      maxHeight={maxHeight}
      hasCommitMessages={hasCommitMessages ?? undefined}
    />
    {!hideControls && <Components.EditorTypeSelect value={contents} setValue={wrappedSetContents} isCollaborative={isCollaborative(document, fieldName)}/>}
    {!hideControls && collectionName==="Posts" && fieldName==="contents" && !!document._id &&
      <Components.PostVersionHistoryButton
        post={document}
        postId={document._id}
      />
    }
    <Transition in={postFlaggedAsCriticism && !criticismTipsDismissed} timeout={0} mountOnEnter unmountOnExit appear>
      {(state) => <Components.PostsEditBotTips
        handleDismiss={handleDismissCriticismTips}
        postId={document._id}
        className={classes[`${state}BotTips`]}
      />}
    </Transition>
  </div>
}

export const EditorFormComponentComponent = registerComponent('EditorFormComponent', EditorFormComponent, {
  hocs: [withErrorBoundary], styles
});

(EditorFormComponent as any).contextTypes = {
  addToSubmitForm: PropTypes.func,
  addToSuccessForm: PropTypes.func,
  updateCurrentValues: PropTypes.func,
};

declare global {
  interface ComponentTypes {
    EditorFormComponent: typeof EditorFormComponentComponent
  }
}
