import React, { useRef, useState, useEffect } from 'react'
import { registerComponent, Components } from '../../lib/vulcan-lib/components';
import CKEditor from '../editor/ReactCKEditor';
import { getCkEditor, ckEditorBundleVersion } from '../../lib/wrapCkEditor';
import { getCKEditorDocumentId, generateTokenRequest} from '../../lib/ckEditorUtils'
import { CollaborativeEditingAccessLevel, accessLevelCan, SharingSettings } from '../../lib/collections/posts/collabEditingPermissions';
import { ckEditorUploadUrlSetting, ckEditorWebsocketUrlSetting } from '../../lib/publicSettings'
import { ckEditorUploadUrlOverrideSetting, ckEditorWebsocketUrlOverrideSetting } from '../../lib/instanceSettings';
import { CollaborationMode } from './EditorTopBar';
import { useSubscribedLocation } from '../../lib/routeUtil';
import { defaultEditorPlaceholder } from '../../lib/editor/make_editable';
import { mentionPluginConfiguration } from "../../lib/editor/mentionsConfig";
import { useCurrentUser } from '../common/withUser';
import { useMessages } from '../common/withMessages';
import { getConfirmedCoauthorIds } from '../../lib/collections/posts/helpers';
import sortBy from 'lodash/sortBy'
import { filterNonnull } from '../../lib/utils/typeGuardUtils';
import { gql, useMutation } from "@apollo/client";
import type { Editor } from '@ckeditor/ckeditor5-core';
import type { Node, RootElement, Writer, Element as CKElement, Selection } from '@ckeditor/ckeditor5-engine';

// Uncomment this line and the reference below to activate the CKEditor debugger
// import CKEditorInspector from '@ckeditor/ckeditor5-inspector';

const styles = (theme: ThemeType): JssStyles => ({
  sidebar: {
    position: 'absolute',
    right: -350,
    width: 300,
    [theme.breakpoints.down('md')]: {
      position: 'absolute',
      right: -100,
      width: 50
    },
    [theme.breakpoints.down('sm')]: {
      right: 0
    }
  },
  addMessageButton: {
    marginBottom: 30,
  },
  hidden: {
    display: "none",
  },
})

const DIALOGUE_MESSAGE_INPUT_WRAPPER = 'dialogueMessageInputWrapper';
const DIALOGUE_MESSAGE_INPUT = 'dialogueMessageInput';
const DIALOGUE_MESSAGE = 'dialogueMessage';

function isElementOfType<T extends string>(type: T) {
  return function(node: Node | undefined): node is (RootElement | CKElement) & { name: T } {
    return !!(node?.is('element', type));
  }
}

const isInputWrapper = isElementOfType(DIALOGUE_MESSAGE_INPUT_WRAPPER);

function areInputsInCorrectOrder(dialogueMessageInputs: Node[], sortedCoauthors: UsersMinimumInfo[]) {
  if (dialogueMessageInputs.length > sortedCoauthors.length) return true //handles case when postfixer doesn't have up to date list of coauthors, up-to-date post fixer for another user can fix the sorting
  return dialogueMessageInputs.every((input, idx) => {
    const inputDisplayName = input.getAttribute('user-id');
    return inputDisplayName === sortedCoauthors[idx]._id;
  });
}

function createMissingInputs(authorsWithoutInputs: UsersMinimumInfo[], writer: Writer, root: (RootElement | CKElement) & { name: "dialogueMessageInputWrapper" }) {
  authorsWithoutInputs.forEach(author => {
    const newUserMessageInput = writer.createElement(DIALOGUE_MESSAGE_INPUT, { 'user-id': author._id, 'display-name': author.displayName });
    writer.append(newUserMessageInput, root);
  });
}

function getAuthorsWithoutInputs(sortedCoauthors: UsersMinimumInfo[], dialogueMessageInputs: Node[]) {
  return sortedCoauthors.filter(coauthor => {
    return !dialogueMessageInputs.some(input => {
      const inputUserId = input.getAttribute('user-id') as string | undefined;
      return coauthor._id === inputUserId;
    });
  });
}

function removeDuplicateInputs(dialogueMessageInputs: Node[], writer: Writer) {
  const inputsForAuthor = new Map<string, Node>();
  return dialogueMessageInputs.some(input => {
    const inputUserId = input.getAttribute('user-id') as string | undefined;
    if (!inputUserId) {
      writer.remove(input);
      return true;
    }

    if (inputsForAuthor.has(inputUserId)) {
      writer.remove(input);
      return true;
    }

    inputsForAuthor.set(inputUserId, input);
    return false;
  });
}

function removeDuplicateInputWrappers(dialogueMessageInputWrappers: Node[], writer: Writer) {
  dialogueMessageInputWrappers.slice(-1).forEach(inputWrapper => {
    writer.remove(inputWrapper);
  });
}

function getElementUserOrder(element: RootElement | CKElement) {
  // Explicitly || rather than ?? to survive things like NaN
  return Number.parseInt((element.getAttribute('user-order') || '0') as string);
}

function getMaxUserOrder(dialogueElements: (RootElement | CKElement)[]) {
  return Math.max(...dialogueElements.map(element => getElementUserOrder(element)))
}

function assignUserOrders(dialogueMessages: (RootElement | CKElement)[], sortedCoauthors: UsersMinimumInfo[], writer: Writer) {
  return dialogueMessages.map(message => {
    const messageUserId = message.getAttribute('user-id');
    const messageUserOrder = getElementUserOrder(message);
    let userOrder = sortedCoauthors.findIndex((author) => author._id === messageUserId) + 1;

    if (userOrder < 1) {
      if (messageUserOrder) {
        userOrder = messageUserOrder;
      } else {
        userOrder = getMaxUserOrder(dialogueMessages) + 1;
      }
    }

    if (userOrder !== messageUserOrder) {
      writer.setAttribute('user-order', userOrder, message);
      return true;
    }

    return false;
  }).some(e => e);
}

function getBlockUserId(modelElement: CKElement) {
  return (modelElement.getAttribute('user-id') || '').toString();
}

function createDialoguePostFixer(editor: Editor, sortedCoauthors: UsersMinimumInfo[]) {
  return (writer: Writer) => {
    const root = editor.model.document.getRoot()!;
    const children = Array.from(root.getChildren());
    const dialogueMessages = children.filter(isElementOfType(DIALOGUE_MESSAGE));

    const inputWrappers = children.filter(isElementOfType(DIALOGUE_MESSAGE_INPUT_WRAPPER));
    
    // We check that we have a wrapper div for the inputs
    if (inputWrappers.length === 0) {
      writer.appendElement(DIALOGUE_MESSAGE_INPUT_WRAPPER, root);
      return true;
    }

    // We check that we don't have multiple input wrappers, somehow
    if (inputWrappers.length > 1) {
      removeDuplicateInputWrappers(inputWrappers, writer);
      return true;
    }

    const lastChild = children.at(-1);
    const inputWrapper = inputWrappers[0];

    // We check that the input wrapper is the last child of the root
    if (!isInputWrapper(lastChild)) {
      writer.append(inputWrapper, root);
      return true;
    }

    const inputWrapperChildren = Array.from(inputWrapper.getChildren());
    const dialogueMessageInputs = [...children, ...inputWrapperChildren].filter(isElementOfType(DIALOGUE_MESSAGE_INPUT));

    const anyIncorrectInputUserOrders = assignUserOrders(dialogueMessageInputs, sortedCoauthors, writer);
    if (anyIncorrectInputUserOrders) {
      return true;
    }

    const anyIncorrectMessageUserOrders = assignUserOrders(dialogueMessages, sortedCoauthors, writer);
    if (anyIncorrectMessageUserOrders) {
      return true;
    }

    // We check that we don't have any _duplicate_ input elements
    const anyExtraRemoved = removeDuplicateInputs(dialogueMessageInputs, writer);
    if (anyExtraRemoved) {
      return true;
    }

    // We check that we have an input element for every author
    const authorsWithoutInputs = getAuthorsWithoutInputs(sortedCoauthors, dialogueMessageInputs);
    createMissingInputs(authorsWithoutInputs, writer, inputWrapper);
    if (authorsWithoutInputs.length > 0) {
      return true;
    }

    // We check that the inputs are in lexical order by author displayName
    const incorrectOrder = !areInputsInCorrectOrder(dialogueMessageInputs, sortedCoauthors);

    // We check that the inputs are the last elements of the document
    // const lastChildren = children.slice(-dialogueMessageInputs.length);
    // const lastElementsAreAllInputs = areLastElementsAllInputs(lastChildren);

    if (incorrectOrder) {
      const sortedInputs = sortBy(dialogueMessageInputs, (i) => getElementUserOrder(i))
      sortedInputs.forEach(sortedInput => {
        writer.append(sortedInput, inputWrapper);
      });
      return true;
    }

    // We ensure that each dialogue input, if otherwise empty, has an empty paragraph
    for (const input of dialogueMessageInputs) {
      const inputIsEmpty = Array.from(input.getChildren()).length === 0;
      if (inputIsEmpty) {
        writer.appendElement('paragraph', input);
        return true;
      }
    }

    // We don't actually want a leading paragraph that'll let users do whatever they want with no friction
    const hasSpuriousLeadingParagraph = children.length === 2
      && children[0].is('element', 'paragraph')
      && Array.from(children[0].getChildren()).length === 0;

    if (hasSpuriousLeadingParagraph) {
      writer.remove(children[0]);
      return true;
    }

    return false;
  };
}

const refreshDisplayMode = ( editor: any, sidebarElement: HTMLDivElement | null ) => {
  if (!sidebarElement) return null
  const annotationsUIs = editor.plugins.get( 'AnnotationsUIs' );
  
  if ( window.innerWidth < 1400 ) {
    sidebarElement.classList.remove( 'hidden' );
    sidebarElement.classList.add( 'narrow' );
    
    annotationsUIs.deactivateAll();
    annotationsUIs.activate('narrowSidebar');
  }
  else {
    sidebarElement.classList.remove( 'hidden', 'narrow' );
    
    annotationsUIs.deactivateAll();
    annotationsUIs.activate('wideSidebar');
  }
}

export type ConnectedUserInfo = {
  _id: string
  name: string
}

const CKPostEditor = ({
  data,
  collectionName,
  fieldName,
  onSave,
  onChange,
  onFocus,
  documentId,
  userId,
  formType,
  onInit,
  isCollaborative,
  accessLevel,
  placeholder,
  document,
  classes
}: {
  data?: any,
  collectionName: CollectionNameString,
  fieldName: string,
  onSave?: any,
  onChange?: any,
  onFocus?: (event: AnyBecauseTodo, editor: AnyBecauseTodo) => void,
  documentId?: string,
  userId?: string,
  formType?: "new"|"edit",
  onInit?: any,
  // Whether this is the contents field of a collaboratively-edited post
  isCollaborative?: boolean,
  // If this is the contents field of a collaboratively-edited post, the access level the
  // logged in user has. Otherwise undefined.
  accessLevel?: CollaborativeEditingAccessLevel,
  placeholder?: string,
  document?: any,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const { flash } = useMessages();
  const post = (document as PostsEdit);
  const isBlockOwnershipMode = isCollaborative && post.collabEditorDialogue;
  
  const { EditorTopBar, DialogueEditorGuidelines } = Components;
  const { PostEditor, PostEditorCollaboration } = getCkEditor();
  const getInitialCollaborationMode = () => {
    if (!isCollaborative || !accessLevel) return "Editing";
    if (accessLevelCan(accessLevel, "edit"))
      return "Editing";
    else if (accessLevelCan(accessLevel, "comment"))
      return "Commenting";
    else
      return "Viewing";
  }
  const initialCollaborationMode = getInitialCollaborationMode()
  const [collaborationMode,setCollaborationMode] = useState<CollaborationMode>(initialCollaborationMode);
  const [connectedUsers,setConnectedUsers] = useState<ConnectedUserInfo[]>([]);

  // Get the linkSharingKey, if it exists
  const { query : { key } } = useSubscribedLocation();
  
  const [sendNewDialogueMessageNotification] = useMutation(gql`
    mutation sendNewDialogueMessageNotification($postId: String!) {
      sendNewDialogueMessageNotification(postId: $postId)
    }
  `);
  const dialogueParticipantNotificationCallback = async () => {
    await sendNewDialogueMessageNotification({
      variables: {
        postId: post._id
      }
    });
  }
  
  const dialogueConfiguration = { dialogueParticipantNotificationCallback }
    
    // To make sure that the refs are populated we have to do two rendering passes
  const [layoutReady, setLayoutReady] = useState(false)
  useEffect(() => {
    setLayoutReady(true)
  }, [])

  const editorRef = useRef<CKEditor>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const hiddenPresenceListRef = useRef<HTMLDivElement>(null)

  const webSocketUrl = ckEditorWebsocketUrlOverrideSetting.get() || ckEditorWebsocketUrlSetting.get();
  const ckEditorCloudConfigured = !!webSocketUrl;
  const initData = typeof(data) === "string" ? data : ""
  
  const applyCollabModeToCkEditor = (editor: Editor, mode: CollaborationMode) => {
    const trackChanges = editor.commands.get('trackChanges')!;
    switch(mode) {
      case "Viewing":
        editor.isReadOnly = true;
        trackChanges.value = false;
        break;
      case "Commenting":
        editor.isReadOnly = false;
        trackChanges.value = true;
        break;
      case "Editing":
        editor.isReadOnly = false;
        trackChanges.value = false;
        break;
    }
  }
  const changeCollaborationMode = (mode: CollaborationMode) => {
    const editor = editorRef.current?.editor;
    if (editor) {
      applyCollabModeToCkEditor(editor, mode);
    }
    setCollaborationMode(mode);
  }

  return <div>
    {isBlockOwnershipMode && <>
     <DialogueEditorGuidelines />
     <style>
      {
      `.dialogue-message-input button {
        display: none;
      }

      ${currentUser ? `.dialogue-message-input[user-id="${currentUser!._id}"] {
        order: 1;
      }` : ``}
      
      ${currentUser ? `.dialogue-message-input[user-id="${currentUser!._id}"] button {
        display: block;
      }` : ``}
      `}
     </style>
    </>}
    
    {isCollaborative && <EditorTopBar
      accessLevel={accessLevel||"none"}
      collaborationMode={collaborationMode}
      setCollaborationMode={changeCollaborationMode}
      post={post}
      connectedUsers={connectedUsers}
    />}
    
    <div className={classes.hidden} ref={hiddenPresenceListRef}/>
    <div ref={sidebarRef} className={classes.sidebar}/>

    {layoutReady && <CKEditor
      ref={editorRef}
      onChange={onChange}
      onFocus={onFocus}
      editor={isCollaborative ? PostEditorCollaboration : PostEditor}
      data={data}
      onInit={(editor: Editor) => {
        if (isCollaborative) {
          // Uncomment this line and the import above to activate the CKEditor debugger
          // CKEditorInspector.attach(editor)

          // We listen to the current window size to determine how to show comments
          window.addEventListener( 'resize', () => refreshDisplayMode(editor, sidebarRef.current) );
          // We then call the method once to determine the current window size
          refreshDisplayMode(editor, sidebarRef.current);
          
          applyCollabModeToCkEditor(editor, collaborationMode);
          
          editor.keystrokes.set('CTRL+ALT+M', 'addCommentThread')
        }

        const userIds = formType === 'new' ? [userId] : [post.userId, ...getConfirmedCoauthorIds(post)];
        if (post.collabEditorDialogue) {
          const rawAuthors = formType === 'new' ? [currentUser!] : filterNonnull([post.user, ...(post.coauthors ?? [])])
          const coauthors = rawAuthors.filter(coauthor => userIds.includes(coauthor._id));
          editor.model.document.registerPostFixer( createDialoguePostFixer(editor, coauthors) );

          // This is just to trigger the postFixer when the editor is initialized
          editor.model.change(writer => {
            const dummyParagraph = writer.createElement('paragraph');
            writer.append(dummyParagraph, editor.model.document.getRoot()!);
            writer.remove(dummyParagraph);
          });
        }

        // Not checking for the plugin's existence causes an error which causes integration tests to fail
        if (editor.plugins.has('Sessions')) {
          const sessionsPlugin = editor.plugins.get('Sessions') as AnyBecauseHard;
          if (sessionsPlugin) {
            const connectedUsers = sessionsPlugin.allConnectedUsers
            const updateConnectedUsers = (usersCollection: AnyBecauseHard) => {
              const newUsersArr = [...usersCollection];
              setConnectedUsers(newUsersArr.map(u => ({
                _id: u.id,
                name: u.name,
              })));
            }
            connectedUsers.on('add', (change: AnyBecauseHard) => {
              if (change.source) {
                updateConnectedUsers(change.source);
              }
            });
            connectedUsers.on('remove', (change: AnyBecauseHard) => {
              if (change.source) {
                updateConnectedUsers(change.source);
              }
            });
          }
        }

        if (isBlockOwnershipMode) {
          editor.model.on('_afterChanges', (change) => {
            const currentSelection: Selection = (change?.source as AnyBecauseHard)?.document?.selection;
            const blocks = currentSelection?.getSelectedBlocks?.();
            const blockOwners: string[] = [];
            if (blocks) {
              for (let block of blocks) {
                const ancestors = block.getAncestors({ includeSelf: true });
                const parentDialogueElement = ancestors.find((ancestor): ancestor is CKElement => {
                  return ancestor.is('element', DIALOGUE_MESSAGE) || ancestor.is('element', DIALOGUE_MESSAGE_INPUT);
                })
                if (parentDialogueElement) {
                  const owner = getBlockUserId(parentDialogueElement);  
                  if (owner && userIds.includes(owner)) {
                    blockOwners.push(owner);
                  }
                }
              }
            }
            
            if (blockOwners.some(blockOwner => blockOwner !== currentUser?._id)) {
              changeCollaborationMode("Commenting");
            } else {
              changeCollaborationMode("Editing");
            }

            const acceptCommand = editor.commands.get('acceptSuggestion');
            if (acceptCommand) {
              // TODO: maybe restrict accepting suggestions to only the user who owns the block, not just any user other than the one that made the suggestion
              // Don't let users accept changes in blocks they don't own
              acceptCommand.on("execute", (command: any, suggestionIds: string[]) => {
                const trackChangesPlugin = editor.plugins.get( 'TrackChanges' );
                if (trackChangesPlugin) {
                  for (let suggestionId of suggestionIds) {
                    const suggestion = (trackChangesPlugin as any).getSuggestion(suggestionId);
                    const suggesterUserId = suggestion.author.id;
                    if (!currentUser || (suggesterUserId === currentUser?._id)) {
                      flash("You cannot accept your own changes");
                      command.stop();
                    }
                  }
                }
              }, {
                priority: "high",
              });
            }
          });
        }

        if (onInit) onInit(editor)
      }}
      config={{
        ...(post.collabEditorDialogue ? {blockToolbar: [
          'imageUpload',
          'insertTable',
          'horizontalLine',
          'mathDisplay',
          'mediaEmbed',
          'footnote',
          'dialogueMessageInput'
        ]} : {}),
        autosave: {
          save (editor: any) {
            return onSave && onSave(editor.getData())
          }
        },
        cloudServices: ckEditorCloudConfigured ? {
          tokenUrl: generateTokenRequest(collectionName, fieldName, documentId, userId, formType, key),
          uploadUrl: ckEditorUploadUrlOverrideSetting.get() || ckEditorUploadUrlSetting.get(),
          webSocketUrl: webSocketUrl,
          documentId: getCKEditorDocumentId(documentId, userId, formType),
          bundleVersion: ckEditorBundleVersion,
        } : undefined,
        collaboration: ckEditorCloudConfigured ? {
          channelId: getCKEditorDocumentId(documentId, userId, formType)
        } : undefined,
        sidebar: {
          container: sidebarRef.current
        },
        presenceList: {
          container: hiddenPresenceListRef.current
        },
        initialData: initData,
        placeholder: placeholder ?? defaultEditorPlaceholder,
        mention: mentionPluginConfiguration,
        dialogues: dialogueConfiguration
      }}
    />}
  </div>
}

const CKPostEditorComponent = registerComponent("CKPostEditor", CKPostEditor, {styles});
declare global {
  interface ComponentTypes {
    CKPostEditor: typeof CKPostEditorComponent
  }
}
