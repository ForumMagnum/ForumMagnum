// /**
//  * Copyright (c) Meta Platforms, Inc. and affiliates.
//  *
//  * This source code is licensed under the MIT license found in the
//  * LICENSE file in the root directory of this source tree.
//  *
//  */

// import type {LexicalEditor} from 'lexical';
// import React, { type JSX } from 'react';

// import {$createCodeNode, $isCodeNode} from '@lexical/code';
// // @ts-ignore
// // eslint-disable-next-line import/no-unresolved
// import { editorStateFromSerializedDocument, exportFile, importFile, SerializedDocument, serializedDocumentFromEditorState } from '@lexical/file';
// import {
//   $convertFromMarkdownString,
//   $convertToMarkdownString,
// } from '@lexical/markdown';
// import {useCollaborationContext} from '@lexical/react/LexicalCollaborationContext';
// import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
// import {mergeRegister} from '@lexical/utils';
// import {CONNECTED_COMMAND, TOGGLE_CONNECT_COMMAND} from '@lexical/yjs';
// import {
//   $createTextNode,
//   $getRoot,
//   $isParagraphNode,
//   CLEAR_EDITOR_COMMAND,
//   CLEAR_HISTORY_COMMAND,
//   COLLABORATION_TAG,
//   COMMAND_PRIORITY_EDITOR,
//   HISTORIC_TAG,
// } from 'lexical';
// import {useCallback, useEffect, useState} from 'react';

// import {INITIAL_SETTINGS} from '../../appSettings';
// import useModal from '../../hooks/useModal';
// import Button from '../../ui/Button';
// import {docFromHash, docToHash} from '../../utils/docSerialization';
// import {PLAYGROUND_TRANSFORMERS} from '../MarkdownTransformers';
// import { MicIcon } from '../../icons/MicIcon';
// import { UploadIcon } from '../../icons/UploadIcon';
// import { DownloadIcon } from '../../icons/DownloadIcon';
// import { SendIcon } from '../../icons/SendIcon';
// import { TrashIcon } from '../../icons/TrashIcon';
// import { LockIcon } from '../../icons/LockIcon';
// import { LockFillIcon } from '../../icons/LockFillIcon';
// import { MarkdownIcon } from '../../icons/MarkdownIcon';
// import { PlugIcon } from '../../icons/PlugIcon';
// import { PlugFillIcon } from '../../icons/PlugFillIcon';
// import { ClockHistoryIcon } from '../../icons/ClockHistoryIcon';
// import { defineStyles, useStyles } from '@/components/hooks/useStyles';
// import classNames from 'classnames';

// const styles = defineStyles('LexicalActionsPlugin', (theme: ThemeType) => ({
//   actions: {
//     position: 'absolute',
//     textAlign: 'right',
//     margin: 10,
//     bottom: 0,
//     right: 0,
//     '& svg': {
//       display: 'inline-block',
//       height: 15,
//       width: 15,
//       verticalAlign: '-0.25em',
//     },
//   },
//   treeView: {
//     borderBottomLeftRadius: 0,
//     borderBottomRightRadius: 0,
//   },
//   actionButton: {
//     backgroundColor: theme.palette.grey[200],
//     border: 0,
//     padding: '8px 12px',
//     position: 'relative',
//     marginLeft: 5,
//     borderRadius: 15,
//     color: theme.palette.grey[800],
//     display: 'inline-block',
//     cursor: 'pointer',
//     '&:hover': {
//       backgroundColor: theme.palette.grey[300],
//       color: theme.palette.grey[1000],
//     },
//     '&:disabled': {
//       opacity: 0.6,
//       backgroundColor: theme.palette.grey[200],
//       cursor: 'not-allowed',
//     },
//   },
//   micActive: {
//     animation: '$micPulsateColor 3s infinite',
//   },
//   '@keyframes micPulsateColor': {
//     '0%': {
//       backgroundColor: '#ffdcdc',
//     },
//     '50%': {
//       backgroundColor: '#ff8585',
//     },
//     '100%': {
//       backgroundColor: '#ffdcdc',
//     },
//   },
// }));
// // import {
// //   SPEECH_TO_TEXT_COMMAND,
// //   SUPPORT_SPEECH_RECOGNITION,
// // } from '../SpeechToTextPlugin';
// import {SHOW_VERSIONS_COMMAND} from '../VersionsPlugin';
// import { useMessages } from '@/components/common/withMessages';

// async function sendEditorState(editor: LexicalEditor): Promise<void> {
//   const stringifiedEditorState = JSON.stringify(editor.getEditorState());
//   try {
//     await fetch('http://localhost:1235/setEditorState', {
//       body: stringifiedEditorState,
//       headers: {
//         Accept: 'application/json',
//         'Content-type': 'application/json',
//       },
//       method: 'POST',
//     });
//   } catch {
//     // NO-OP
//   }
// }

// async function validateEditorState(editor: LexicalEditor): Promise<void> {
//   const stringifiedEditorState = JSON.stringify(editor.getEditorState());
//   let response = null;
//   try {
//     response = await fetch('http://localhost:1235/validateEditorState', {
//       body: stringifiedEditorState,
//       headers: {
//         Accept: 'application/json',
//         'Content-type': 'application/json',
//       },
//       method: 'POST',
//     });
//   } catch {
//     // NO-OP
//   }
//   if (response !== null && response.status === 403) {
//     throw new Error(
//       'Editor state validation failed! Server did not accept changes.',
//     );
//   }
// }

// async function shareDoc(doc: SerializedDocument): Promise<void> {
//   const url = new URL(window.location.toString());
//   url.hash = await docToHash(doc);
//   const newUrl = url.toString();
//   window.history.replaceState({}, '', newUrl);
//   await window.navigator.clipboard.writeText(newUrl);
// }

// export default function ActionsPlugin({
//   shouldPreserveNewLinesInMarkdown,
//   useCollabV2,
// }: {
//   shouldPreserveNewLinesInMarkdown: boolean;
//   useCollabV2: boolean;
// }): JSX.Element {
//   const [editor] = useLexicalComposerContext();
//   const [isEditable, setIsEditable] = useState(() => editor.isEditable());
//   const [isSpeechToText, setIsSpeechToText] = useState(false);
//   const [connected, setConnected] = useState(false);
//   const [isEditorEmpty, setIsEditorEmpty] = useState(true);
//   const [modal, showModal] = useModal();
//   const { flash: showFlashMessage } = useMessages();
//   const {isCollabActive} = useCollaborationContext();
//   useEffect(() => {
//     if (INITIAL_SETTINGS.isCollab) {
//       return;
//     }
//     void docFromHash(window.location.hash).then((doc) => {
//       if (doc && doc.source === 'Playground') {
//         editor.setEditorState(editorStateFromSerializedDocument(editor, doc));
//         editor.dispatchCommand(CLEAR_HISTORY_COMMAND, undefined);
//       }
//     });
//   }, [editor]);
//   useEffect(() => {
//     return mergeRegister(
//       editor.registerEditableListener((editable) => {
//         setIsEditable(editable);
//       }),
//       editor.registerCommand<boolean>(
//         CONNECTED_COMMAND,
//         (payload) => {
//           const isConnected = payload;
//           setConnected(isConnected);
//           return false;
//         },
//         COMMAND_PRIORITY_EDITOR,
//       ),
//     );
//   }, [editor]);

//   useEffect(() => {
//     return editor.registerUpdateListener(
//       ({dirtyElements, prevEditorState, tags}) => {
//         // If we are in read only mode, send the editor state
//         // to server and ask for validation if possible.
//         if (
//           !isEditable &&
//           dirtyElements.size > 0 &&
//           !tags.has(HISTORIC_TAG) &&
//           !tags.has(COLLABORATION_TAG)
//         ) {
//           void validateEditorState(editor);
//         }
//         editor.getEditorState().read(() => {
//           const root = $getRoot();
//           const children = root.getChildren();

//           if (children.length > 1) {
//             setIsEditorEmpty(false);
//           } else {
//             if ($isParagraphNode(children[0])) {
//               const paragraphChildren = children[0].getChildren();
//               setIsEditorEmpty(paragraphChildren.length === 0);
//             } else {
//               setIsEditorEmpty(false);
//             }
//           }
//         });
//       },
//     );
//   }, [editor, isEditable]);

//   const handleMarkdownToggle = useCallback(() => {
//     editor.update(() => {
//       const root = $getRoot();
//       const firstChild = root.getFirstChild();
//       if ($isCodeNode(firstChild) && firstChild.getLanguage() === 'markdown') {
//         $convertFromMarkdownString(
//           firstChild.getTextContent(),
//           PLAYGROUND_TRANSFORMERS,
//           undefined, // node
//           shouldPreserveNewLinesInMarkdown,
//         );
//       } else {
//         const markdown = $convertToMarkdownString(
//           PLAYGROUND_TRANSFORMERS,
//           undefined, //node
//           shouldPreserveNewLinesInMarkdown,
//         );
//         const codeNode = $createCodeNode('markdown');
//         codeNode.append($createTextNode(markdown));
//         root.clear().append(codeNode);
//         if (markdown.length === 0) {
//           codeNode.select();
//         }
//       }
//     });
//   }, [editor, shouldPreserveNewLinesInMarkdown]);

//   const classes = useStyles(styles);

//   return (
//     <div className={classes.actions}>
//       {/* {SUPPORT_SPEECH_RECOGNITION && (
//         <button
//           onClick={() => {
//             editor.dispatchCommand(SPEECH_TO_TEXT_COMMAND, !isSpeechToText);
//             setIsSpeechToText(!isSpeechToText);
//           }}
//           className={classNames(classes.actionButton, isSpeechToText && classes.micActive)}
//           title="Speech To Text"
//           aria-label={`${
//             isSpeechToText ? 'Enable' : 'Disable'
//           } speech to text`}>
//           <MicIcon />
//         </button>
//       )} */}
//       <button
//         className={classes.actionButton}
//         onClick={() => importFile(editor)}
//         title="Import"
//         aria-label="Import editor state from JSON">
//         <UploadIcon />
//       </button>

//       <button
//         className={classes.actionButton}
//         onClick={() =>
//           exportFile(editor, {
//             fileName: `Playground ${new Date().toISOString()}`,
//             source: 'Playground',
//           })
//         }
//         title="Export"
//         aria-label="Export editor state to JSON">
//         <DownloadIcon />
//       </button>
//       <button
//         className={classes.actionButton}
//         disabled={isCollabActive || INITIAL_SETTINGS.isCollab}
//         onClick={() =>
//           shareDoc(
//             serializedDocumentFromEditorState(editor.getEditorState(), {
//               source: 'Playground',
//             }),
//           ).then(
//             () => showFlashMessage('URL copied to clipboard'),
//             () => showFlashMessage('URL could not be copied to clipboard'),
//           )
//         }
//         title="Share"
//         aria-label="Share Playground link to current editor state">
//         <SendIcon />
//       </button>
//       <button
//         className={classes.actionButton}
//         disabled={isEditorEmpty}
//         onClick={() => {
//           showModal('Clear editor', (onClose) => (
//             <ShowClearDialog editor={editor} onClose={onClose} />
//           ));
//         }}
//         title="Clear"
//         aria-label="Clear editor contents">
//         <TrashIcon />
//       </button>
//       <button
//         className={classes.actionButton}
//         onClick={() => {
//           // Send latest editor state to commenting validation server
//           if (isEditable) {
//             void sendEditorState(editor);
//           }
//           editor.setEditable(!editor.isEditable());
//         }}
//         title="Read-Only Mode"
//         aria-label={`${!isEditable ? 'Unlock' : 'Lock'} read-only mode`}>
//         {!isEditable ? <LockIcon /> : <LockFillIcon />}
//       </button>
//       <button
//         className={classes.actionButton}
//         onClick={handleMarkdownToggle}
//         title="Convert From Markdown"
//         aria-label="Convert from markdown">
//         <MarkdownIcon />
//       </button>
//       {isCollabActive && (
//         <>
//           <button
//             className={classes.actionButton}
//             onClick={() => {
//               editor.dispatchCommand(TOGGLE_CONNECT_COMMAND, !connected);
//             }}
//             title={`${
//               connected ? 'Disconnect' : 'Connect'
//             } Collaborative Editing`}
//             aria-label={`${
//               connected ? 'Disconnect from' : 'Connect to'
//             } a collaborative editing server`}>
//             {connected ? <PlugFillIcon /> : <PlugIcon />}
//           </button>
//           {useCollabV2 && (
//             <button
//               className={classes.actionButton}
//               onClick={() => {
//                 editor.dispatchCommand(SHOW_VERSIONS_COMMAND, undefined);
//               }}>
//               <ClockHistoryIcon />
//             </button>
//           )}
//         </>
//       )}
//       {modal}
//     </div>
//   );
// }

// function ShowClearDialog({
//   editor,
//   onClose,
// }: {
//   editor: LexicalEditor;
//   onClose: () => void;
// }): JSX.Element {
//   return (
//     <>
//       Are you sure you want to clear the editor?
//       <div className="Modal__content">
//         <Button
//           onClick={() => {
//             editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined);
//             editor.focus();
//             onClose();
//           }}>
//           Clear
//         </Button>{' '}
//         <Button
//           onClick={() => {
//             editor.focus();
//             onClose();
//           }}>
//           Cancel
//         </Button>
//       </div>
//     </>
//   );
// }
