import React, { useRef, useState, useEffect } from 'react'
import { registerComponent, Components } from '../../lib/vulcan-lib/components';
import CKEditor from '../editor/ReactCKEditor';
import { getCkEditor, ckEditorBundleVersion } from '../../lib/wrapCkEditor';
import { getCKEditorDocumentId, generateTokenRequest} from '../../lib/ckEditorUtils'
import { CollaborativeEditingAccessLevel, accessLevelCan, SharingSettings } from '../../lib/collections/posts/collabEditingPermissions';
import { ckEditorUploadUrlSetting, ckEditorWebsocketUrlSetting } from '../../lib/publicSettings'
import { ckEditorUploadUrlOverrideSetting, ckEditorWebsocketUrlOverrideSetting } from '../../lib/instanceSettings';
import { CollaborationMode } from './EditorTopBar';
import { useLocation, useSubscribedLocation } from '../../lib/routeUtil';
import { defaultEditorPlaceholder } from '../../lib/editor/make_editable';
import { mentionPluginConfiguration } from "../../lib/editor/mentionsConfig";
import type { Editor } from "@ckeditor/ckeditor5-core";
import type { Element as CKElement, Selection, Node, Writer, RootElement } from "@ckeditor/ckeditor5-engine";
import { useCurrentUser } from '../common/withUser';
import { useMessages } from '../common/withMessages';
import Button from '@material-ui/core/Button';
import { getConfirmedCoauthorIds } from '../../lib/collections/posts/helpers';
import sortBy from 'lodash/sortBy'
import { filterNonnull } from '../../lib/utils/typeGuardUtils';

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
})


function areLastElementsAllInputs(lastChildren: Node[]) {
  return lastChildren.every(child => {
    return child.is('element', 'dialogueMessageInput');
  });
}

function areInputsInCorrectOrder(dialogueMessageInputs: Node[], coauthors: UsersMinimumInfo[]) {
  return dialogueMessageInputs.every((input, idx) => {
    const inputDisplayName = input.getAttribute('display-name');
    return inputDisplayName === coauthors[idx].displayName;
  });
}

function createMissingInputs(authorsWithoutInputs: UsersMinimumInfo[], writer: Writer, root: RootElement) {
  authorsWithoutInputs.forEach(author => {
    const newUserMessageInput = writer.createElement('dialogueMessageInput', { 'user-id': author._id, 'display-name': author.displayName });
    writer.append(newUserMessageInput, root);
  });
}

function getInputsWithoutAuthors(dialogueMessageInputs: Node[], coauthors: UsersMinimumInfo[]) {
  return dialogueMessageInputs.filter(input => {
    return !coauthors.some(coauthor => {
      const inputUserId = input.getAttribute('user-id') as string | undefined;
      return coauthor._id === inputUserId;
    });
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

const refreshDisplayMode = ( editor: any, sidebarElement: HTMLDivElement | null ) => {
  if (!sidebarElement) return null
  const annotationsUIs = editor.plugins.get( 'AnnotationsUIs' );
  
  if ( window.innerWidth < 1000 ) {
    sidebarElement.classList.remove( 'narrow' );
    sidebarElement.classList.add( 'hidden' );
    
    annotationsUIs.deactivateAll();
    annotationsUIs.activate('inline');
  }
  else if ( window.innerWidth < 1400 ) {
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
  const { query } = useLocation();
  const { flash } = useMessages();
  const post = (document as PostsEdit);
  const isBlockOwnershipMode = isCollaborative && (query.blockOwnership || post.collabEditorDialogue);
  
  const { EditorTopBar } = Components;
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

  // Get the linkSharingKey, if it exists
  const { query : { key } } = useSubscribedLocation();
  
  // To make sure that the refs are populated we have to do two rendering passes
  const [layoutReady, setLayoutReady] = useState(false)
  useEffect(() => {
    setLayoutReady(true)
  }, [])

  const editorRef = useRef<CKEditor>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const presenceListRef = useRef<HTMLDivElement>(null)

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
  
  const isRelevantUsername = (name: string): boolean => {
    return name.indexOf(' ')===-1;
  }
  const getBlockOwner = (block: CKElement): string|null => {
    const json: any = block.toJSON();
    const text = (json.children ?? []).map((child: any) => child.data).join("");
    console.log(`Checking block with text: ${text}`);
    const splitOnColon = text.split(':');
    if (splitOnColon.length>1 && isRelevantUsername(splitOnColon[0])) {
      const markedUsername = splitOnColon[0].toLowerCase();
      for (let sharedUser of [...post.usersSharedWith, post.user!]) {
        if (sharedUser.displayName.toLowerCase()===markedUsername || sharedUser.slug.toLowerCase()===markedUsername) {
          return sharedUser._id;
        }
      }
    }

    return null;
  }
  
  return <div>
    {isCollaborative && <EditorTopBar
      accessLevel={accessLevel||"none"}
      presenceListRef={presenceListRef}
      collaborationMode={collaborationMode}
      setCollaborationMode={changeCollaborationMode}
    />}
    
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
        const rawAuthors = formType === 'new' ? [currentUser!] : filterNonnull([post.user, ...(post.coauthors ?? [])])
        const coauthors = rawAuthors.filter(coauthor => userIds.includes(coauthor._id));

        const sortedCoauthors = sortBy(coauthors, (coauthor) => coauthor.displayName);
        
        editor.model.document.registerPostFixer( writer => {
          const root = editor.model.document.getRoot()!;
          const children = Array.from(root.getChildren());
          const dialogueMessageInputs = children.filter(child => child.is('element', 'dialogueMessageInput'));

          // We require a paragraph at the start of the document, since otherwise users wouldn't be able to write any content manually
          if (children.length === dialogueMessageInputs.length) {
            writer.insertElement('paragraph', {}, root, 0);
            return true;
          }

          // We check that we don't have any _duplicate_ input elements
          const anyExtraRemoved = removeDuplicateInputs(dialogueMessageInputs, writer);
          if (anyExtraRemoved) {
            return true;
          }

          // We check that we have an input element for every author
          const authorsWithoutInputs = getAuthorsWithoutInputs(sortedCoauthors, dialogueMessageInputs);
          createMissingInputs(authorsWithoutInputs, writer, root);

          const inputsWithoutAuthors = getInputsWithoutAuthors(dialogueMessageInputs, coauthors);
          if (inputsWithoutAuthors.length > 0 || authorsWithoutInputs.length > 0) {
            return true;
          }

          // We check that the inputs are in lexical order by author displayName
          const incorrectOrder = !areInputsInCorrectOrder(dialogueMessageInputs, coauthors);

          // We check that the inputs are the last elements of the document
          const lastChildren = children.slice(-dialogueMessageInputs.length);
          const lastElementsAreAllInputs = areLastElementsAllInputs(lastChildren);

          if (incorrectOrder || !lastElementsAreAllInputs) {
            const sortedInputs = sortBy(dialogueMessageInputs, (i) => i.getAttribute('display-name'));
            sortedInputs.forEach(sortedInput => {
              writer.append(sortedInput, root);
            });
            return true;
          }

          return false;
        } );

        if (isBlockOwnershipMode) {
          editor.model.on('_afterChanges', (change) => {
            const currentSelection: Selection = (change?.source as AnyBecauseHard)?.document?.selection;
            const blocks = currentSelection?.getSelectedBlocks?.();
            const blockOwners: string[] = [];
            if (blocks) {
              for (let block of blocks) {
                const owner = getBlockOwner(block);
                if (owner) {
                  blockOwners.push(owner);
                }
              }
            }
            
            if (blockOwners.some(blockOwner => blockOwner !== currentUser!._id)) {
              console.log("Switching into suggest mode");
              changeCollaborationMode("Commenting");
            } else {
              console.log("Leaving suggest mode");
              changeCollaborationMode("Editing");
            }

            const acceptCommand = editor.commands.get('acceptSuggestion');
            if (acceptCommand) {
              // Don't let users accept changes in blocks they don't own
              acceptCommand.on("execute", (command: any, suggestionIds: string[]) => {
                const trackChangesPlugin = editor.plugins.get( 'TrackChanges' );
                if (trackChangesPlugin) {
                  for (let suggestionId of suggestionIds) {
                    const suggestion = (trackChangesPlugin as any).getSuggestion(suggestionId);
                    const suggesterUserId = suggestion.author.id;
                    if (suggesterUserId === currentUser!._id) {
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
         // bundleVersion: ckEditorBundleVersion,
        } : undefined,
        collaboration: ckEditorCloudConfigured ? {
          channelId: getCKEditorDocumentId(documentId, userId, formType)
        } : undefined,
        sidebar: {
          container: sidebarRef.current
        },
        presenceList: {
          container: presenceListRef.current
        },
        initialData: initData,
        placeholder: placeholder ?? defaultEditorPlaceholder,
        mention: mentionPluginConfiguration
      }}
    />}
    
    {layoutReady && isBlockOwnershipMode && <Button
      className={classes.addMessageButton}
      onClick={ev => {
        const textToInsert = currentUser?.displayName+": ";
        const editor = (editorRef.current?.editor as Editor);
        
        editor.model.change(writer => {
          // Create a new paragraph element with the given text.
          const paragraph = writer.createElement('paragraph');
          const textNode = writer.createText(textToInsert);
  
          writer.append(textNode, paragraph);
  
          // Find the root in which the editor content is stored.
          const root = editor.model.document.getRoot();
  
          // Append the new paragraph to the root.
          if (root) {
            writer.append(paragraph, root);
          }
          
          // TODO move the cursor to the end of that paragraph, and set focus
        });
      }}
    >
      Add Message
    </Button>}
  </div>
}

const CKPostEditorComponent = registerComponent("CKPostEditor", CKPostEditor, {styles});
declare global {
  interface ComponentTypes {
    CKPostEditor: typeof CKPostEditorComponent
  }
}