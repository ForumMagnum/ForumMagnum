import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { IS_APPLE, mergeRegister } from '@lexical/utils'
import type { LexicalEditor, NodeKey } from 'lexical'
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  $isRangeSelection,
  $isRootOrShadowRoot,
  $isTextNode,
  $nodesOfType,
  COMMAND_PRIORITY_CRITICAL,
  DROP_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  INDENT_CONTENT_COMMAND,
  INSERT_TAB_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  KEY_DOWN_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_TAB_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  PASTE_COMMAND,
  SELECTION_INSERT_CLIPBOARD_NODES_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
} from 'lexical'
import React, { useEffect, useRef, useState } from 'react'
import { ProtonNode, $isSuggestionNode } from './ProtonNode'
import { SuggestionTypesThatCanBeEmpty, type SuggestionID } from './Types'
import { BEFOREINPUT_EVENT_COMMAND, COMPOSITION_START_EVENT_COMMAND, INSERT_FILE_COMMAND } from '@/components/editor/lexicalPlugins/suggestions/Events'
import type { SuggestionThreadController } from '@/components/editor/lexicalPlugins/suggestions/SuggestionThreadController'
import { reportError } from '@/lib/vendor/proton/reportError'
import { useMarkNodesContext } from '@/components/editor/lexicalPlugins/suggestions/MarkNodesContext'
import { useCommentStoreContext } from '@/components/lexical/commenting/CommentStoreContext'
import { ACCEPT_SUGGESTION_COMMAND, REJECT_SUGGESTION_COMMAND, TOGGLE_SUGGESTION_MODE_COMMAND } from './Commands'
import { UNORDERED_LIST, ORDERED_LIST, CHECK_LIST, QUOTE } from '@lexical/markdown'
import { INSERT_CHECK_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND, type ListItemNode } from '@lexical/list'
import { $isEmptyListItemExceptForSuggestions } from './Utils'
import { generateUUID } from '@/lib/vendor/proton/generateUUID'
import { $acceptSuggestion } from './acceptSuggestion'
import { $rejectSuggestion } from './rejectSuggestion'
import { $handleBeforeInputEvent, $handleDeleteInputType, $handleInsertParagraphOnEmptyListItem } from './handleBeforeInputEvent'
import { $formatTextAsSuggestion } from './formatTextAsSuggestion'
import { ConsoleLogger } from '@/lib/vendor/proton/logger'
import { $selectionInsertClipboardNodes } from './selectionInsertClipboardNodes'
import { LINK_CHANGE_COMMAND } from '@/components/editor/lexicalPlugins/suggestions/linkChangeSuggestionCommand'
import { $handleLinkChangeSuggestion } from './handleLinkChangeSuggestion'
import { generateSuggestionSummary } from './generateSuggestionSummary'
import { INSERT_IMAGE_COMMAND, type InsertImagePayload } from '@/components/lexical/plugins/ImagesPlugin'
import {
  SET_IMAGE_CAPTION_VISIBILITY_COMMAND,
  SET_IMAGE_SIZE_COMMAND,
} from '@/components/lexical/plugins/ImagesPlugin/commands'
import {
  $handleImageDragAndDropAsSuggestion,
  $handleImageSizeChangeAsSuggestion,
  $handleImageCaptionToggleAsSuggestion,
  $handleImageDeleteAsSuggestion,
  $insertImageNodeAsSuggestion,
} from './imageHandling'
import { $handleDividerDeleteAsSuggestion } from './dividerHandling'
import { EditorUserMode, type EditorUserModeType } from '@/components/editor/lexicalPlugins/suggestions/EditorUserMode'
import { $handleIndentOutdentAsSuggestion } from './handleIndentOutdent'
import {
  DELETE_TABLE_COLUMN_COMMAND,
  DELETE_TABLE_COMMAND,
  DELETE_TABLE_ROW_COMMAND,
  INSERT_TABLE_COLUMN_COMMAND,
  INSERT_TABLE_COMMAND,
  INSERT_TABLE_ROW_COMMAND,
} from '@/components/editor/lexicalPlugins/suggestions/Table/Commands'
import {
  $insertNewTableAsSuggestion,
  $insertNewTableColumnAsSuggestion,
  $insertNewTableRowAsSuggestion,
  $suggestTableColumnDeletion,
  $suggestTableDeletion,
  $suggestTableRowDeletion,
} from './handleTables'
import { SET_BLOCK_TYPE_COMMAND } from '@/components/editor/lexicalPlugins/suggestions/blockTypeSuggestionUtils'
import { $setBlocksTypeAsSuggestion } from './setBlocksTypeAsSuggestion'
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode'
import { $insertDividerAsSuggestion } from './insertDividerAsSuggestion'
import { HR } from '@/components/lexical/plugins/MarkdownTransformers'
import { $getTopLevelParagraphForHR } from '@/components/editor/lexicalPlugins/horizontalRuleEnter'
import { $setElementAlignmentAsSuggestion } from './setElementAlignmentAsSuggestion'
import { $insertListAsSuggestion } from './insertListAsSuggestion'
import { eventFiles } from '@lexical/rich-text'
import { $createImageNode } from '@/components/lexical/nodes/ImageNode'
import { isImageFile } from '@/components/lexical/plugins/ImagesPlugin/ImageUtils'
import { ImageUploadError, uploadToCloudinary } from '@/components/lexical/utils/cloudinaryUpload'
import { useMessages } from '@/components/common/withMessages'

function getImageAltText(payload: Blob): string {
  return payload instanceof File ? payload.name : ''
}

function insertImageFileAsSuggestion(
  editor: LexicalEditor,
  payload: Blob,
  onSuggestionCreation: (id: string) => void,
  logger: ConsoleLogger,
): boolean {
  if (!isImageFile(payload) || !(payload instanceof File)) {
    return false
  }
  uploadToCloudinary(payload)
    .then((result) => {
      const altText = getImageAltText(payload)
      editor.update(() => {
        const imageNode = $createImageNode({
          altText,
          src: result.secure_url,
          width: result.width,
          height: result.height,
        })
        $insertImageNodeAsSuggestion(imageNode, onSuggestionCreation, logger)
      })
    })
    .catch((error) => {
      if (error instanceof ImageUploadError) {
        reportError(error)
        return
      }
      reportError(error)
    })
  return true
}

const LIST_TRANSFORMERS = [UNORDERED_LIST, ORDERED_LIST, CHECK_LIST]

const SUGGESTION_SUMMARY_KIND = 'suggestionSummary' as const

/** Check if a suggestion thread has comments beyond the auto-generated summary */
function hasChildComments(thread: { comments: Array<{ commentKind?: string }> }): boolean {
  return thread.comments.some((comment) => comment.commentKind !== SUGGESTION_SUMMARY_KIND)
}

export function SuggestionModePlugin({
  isSuggestionMode,
  controller,
  onUserModeChange,
}: {
  isSuggestionMode: boolean
  controller: SuggestionThreadController
  onUserModeChange: (mode: EditorUserModeType) => void
}) {
  const [editor] = useLexicalComposerContext()

  const { markNodeMap } = useMarkNodesContext()
  const { commentStore } = useCommentStoreContext()

  const [suggestionModeLogger] = useState(() => new ConsoleLogger('docs-suggestions-mode'))

  const { flash: createNotification } = useMessages()

  /**
   * Set of suggestion IDs created during the current session.
   * When the mutation listener for suggestion nodes is triggered,
   * we check this set to see whether a new thread should be created.
   * Once a thread is created, we remove that suggestion ID from this set.
   */
  const createdSuggestionIDsRef = useRef(new Set<string>())

  /** Tracks whether the current historic update is a redo (vs an undo) */
  const isRedoOperationRef = useRef(false)

  useEffect(() => {
    // Track whether the current historic operation is a redo (vs an undo)
    return mergeRegister(
      editor.registerCommand(
        UNDO_COMMAND,
        () => {
          isRedoOperationRef.current = false
          return false
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        REDO_COMMAND,
        () => {
          isRedoOperationRef.current = true
          return false
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      // Clear the flag after each update via microtask (after mutation listeners have read it)
      editor.registerUpdateListener(() => {
        queueMicrotask(() => {
          isRedoOperationRef.current = false
        })
      }),
    )
  }, [editor])

  useEffect(() => {
    /**
     * Temporary map of suggestion node keys to their suggestion ID,
     * used to get the ID for a key when that node is destroyed.
     */
    const suggestionNodeKeysToIDMap = new Map<NodeKey, SuggestionID>()

    return mergeRegister(
      /**
       * Handles suggestion node lifecycle:
       * - Maintaining ID->NodeKey mappings for hover/active states
       * - Creating threads for new suggestions
       * - Reopening threads when nodes reappear (undo)
       * - Restoring status when nodes are removed via redo
       * - Orphan cleanup when nodes are deleted
       */
      editor.registerMutationListener(ProtonNode, (mutations, { updateTags }) => {
        if (updateTags.has('collaboration')) {
          return
        }
        
        const createdSuggestionIDs = createdSuggestionIDsRef.current
        const idsToCreateThreadsFor: string[] = []
        const idsToReopenThreadsFor: string[] = []
        const idsToHandleDestruction: string[] = []

        editor.read(() => {
          for (const [key, mutation] of mutations) {
            const node = $getNodeByKey(key)

            let id: string = ''
            if (mutation === 'destroyed') {
              id = suggestionNodeKeysToIDMap.get(key) || ''
            } else if ($isSuggestionNode(node)) {
              id = node.getSuggestionIdOrThrow()
            }

            if (!id) {
              continue
            }

            let suggestionNodeKeys = markNodeMap.get(id)
            suggestionNodeKeysToIDMap.set(key, id)

            if (mutation === 'destroyed') {
              if (!suggestionNodeKeys) {
                continue
              }
              suggestionNodeKeys.delete(key)
              if (suggestionNodeKeys.size === 0) {
                markNodeMap.delete(id)
                idsToHandleDestruction.push(id)
              }
            } else {
              if (!suggestionNodeKeys) {
                // New suggestion
                suggestionNodeKeys = new Set()
                markNodeMap.set(id, suggestionNodeKeys)
                
                if (createdSuggestionIDs.has(id)) {
                  idsToCreateThreadsFor.push(id)
                } else {
                  // Nodes appeared but weren't created locally - likely undo
                  idsToReopenThreadsFor.push(id)
                }
                
                suggestionNodeKeys.add(key)
              } else {
                if (!suggestionNodeKeys.has(key)) {
                  suggestionNodeKeys.add(key)
                }
              }
            }
          }
        })

        // Skip thread management if commentStore hasn't synced yet (e.g., initial page load)
        // The markNodeMap is still updated above for hover/active state tracking
        if (!commentStore.isSynced()) {
          return
        }

        // Create threads for new suggestions
        for (const id of idsToCreateThreadsFor) {
          const keys = markNodeMap.get(id)
          if (!keys || keys.size === 0) {
            continue
          }

          suggestionModeLogger.info(`Creating new thread for suggestion ${id}`)
          const summary = generateSuggestionSummary(editor, markNodeMap, id)
          const content = JSON.stringify(summary)

          controller
            .createSuggestionThread(id, content, summary[0].type)
            .then(() => {
              createdSuggestionIDs.delete(id)
              suggestionModeLogger.info(`Removed id ${id} from set ${[...createdSuggestionIDs]}`)
            })
            .catch(reportError)
        }

        // Reopen threads when nodes reappear (undo)
        for (const id of idsToReopenThreadsFor) {
          const thread = commentStore.getThreadByMarkID(id)
          
          if (!thread) {
            // Thread was deleted - create a new one
            suggestionModeLogger.info(`Creating thread for reappearing suggestion ${id}`)
            const summary = generateSuggestionSummary(editor, markNodeMap, id)
            const content = JSON.stringify(summary)
            controller.createSuggestionThread(id, content, summary[0].type).catch(reportError)
            continue
          }
          
          if (thread.status === 'accepted' || thread.status === 'rejected') {
            suggestionModeLogger.info(`Reopening thread ${thread.id} for suggestion ${id}`)
            commentStore.updateThread(thread.id, {
              statusBeforeReopen: thread.status,
              status: 'open',
            })
          } else if (thread.status === 'archived') {
            suggestionModeLogger.info(`Reopening archived thread ${thread.id} for suggestion ${id}`)
            commentStore.updateThread(thread.id, { status: 'open' })
          }
          
          const keys = markNodeMap.get(id)
          if (keys && keys.size > 0) {
            const summary = generateSuggestionSummary(editor, markNodeMap, id)
            const content = JSON.stringify(summary)
            controller.updateSuggestionSummary(id, content).catch(reportError)
          }
        }

        // Handle node destruction (redo or orphan cleanup)
        const isRedoOperation = isRedoOperationRef.current
        
        for (const id of idsToHandleDestruction) {
          const thread = commentStore.getThreadByMarkID(id)
          if (!thread) {
            continue
          }

          if (isRedoOperation && thread.statusBeforeReopen) {
            // Redo: restore the status from before undo reopened the thread
            suggestionModeLogger.info(`Restoring thread ${thread.id} status to ${thread.statusBeforeReopen}`)
            commentStore.updateThread(thread.id, {
              status: thread.statusBeforeReopen,
              statusBeforeReopen: null,
            })
          } else if (thread.status === 'open') {
            // Orphan cleanup: archive if has comments, otherwise delete
            if (hasChildComments(thread)) {
              suggestionModeLogger.info(`Archiving thread ${thread.id} (orphan with comments)`)
              commentStore.updateThread(thread.id, { status: 'archived', statusBeforeReopen: null })
            } else {
              suggestionModeLogger.info(`Deleting thread ${thread.id} (orphan)`)
              commentStore.deleteCommentOrThread(thread)
            }
          } else if (thread.statusBeforeReopen) {
            // Clear stale statusBeforeReopen
            commentStore.updateThread(thread.id, { statusBeforeReopen: null })
          }
        }
      }),
      // The ProtonNode mutation listener only fires for node creation/destruction/property changes,
      // not for text content changes within the node (which are TextNode mutations).
      editor.registerUpdateListener(({ tags }) => {
        if (tags.has('collaboration')) {
          return
        }
        
        for (const [id, keys] of markNodeMap) {
          if (keys.size === 0) {
            continue
          }
          const summary = generateSuggestionSummary(editor, markNodeMap, id)
          const content = JSON.stringify(summary)
          controller.updateSuggestionSummary(id, content).catch(reportError)
        }
      }),
    )
  }, [controller, editor, markNodeMap, suggestionModeLogger, commentStore])

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        TOGGLE_SUGGESTION_MODE_COMMAND,
        () => {
          if (isSuggestionMode) {
            onUserModeChange(EditorUserMode.Edit)
            return true
          }
          onUserModeChange(EditorUserMode.Suggest)
          return true
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        ACCEPT_SUGGESTION_COMMAND,
        (suggestionID) => {
          if (!editor.isEditable()) {
            return false
          }
          // Get thread synchronously before modifying nodes
          const thread = commentStore.getThreadByMarkID(suggestionID)
          if (!thread) {
            suggestionModeLogger.warn(`No thread found for suggestion ${suggestionID} during accept`)
          }
          
          const handled = $acceptSuggestion(suggestionID)
          
          if (handled && thread) {
            commentStore.updateThread(thread.id, { 
              status: 'accepted',
              statusBeforeReopen: null,
            })
          }
          return handled
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        REJECT_SUGGESTION_COMMAND,
        (suggestionID) => {
          if (!editor.isEditable()) {
            return false
          }
          // Get thread synchronously before modifying nodes
          const thread = commentStore.getThreadByMarkID(suggestionID)
          if (!thread) {
            suggestionModeLogger.warn(`No thread found for suggestion ${suggestionID} during reject`)
          }
          
          const handled = $rejectSuggestion(suggestionID)
          
          if (handled && thread) {
            commentStore.updateThread(thread.id, { 
              status: 'rejected',
              statusBeforeReopen: null,
            })
          }
          return handled
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerUpdateListener(({dirtyElements, tags}) => {
        if (tags.has('collaboration')) {
          return;
        }
        editor.update(() => {
          for (const key of dirtyElements.keys()) {
            const node = $getNodeByKey(key);
            if (!$isSuggestionNode(node)) {
              continue;
            }
            const type = node.getSuggestionTypeOrThrow()
            if (SuggestionTypesThatCanBeEmpty.includes(type)) {
              continue;
            }
            if (node.getChildrenSize() === 0) {
              const id = node.getSuggestionIdOrThrow()
              suggestionModeLogger.info('Removing empty suggestion node', id, type)
              node.remove()
            }
          }
        });
      }),
    )
  }, [editor, isSuggestionMode, onUserModeChange, suggestionModeLogger, commentStore])

  useEffect(() => {
    if (!isSuggestionMode) {
      return
    }

    const addCreatedIDtoSet = (id: string) => {
      createdSuggestionIDsRef.current.add(id)
      suggestionModeLogger.info('Created suggestion node with ID: ', id)
    }

    return mergeRegister(
      editor.registerCommand(
        FORMAT_TEXT_COMMAND,
        (payload) => {
          return $formatTextAsSuggestion(payload, addCreatedIDtoSet, suggestionModeLogger)
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        FORMAT_ELEMENT_COMMAND,
        (payload) => {
          return $setElementAlignmentAsSuggestion(payload, addCreatedIDtoSet, suggestionModeLogger)
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        INSERT_TAB_COMMAND,
        () => {
          return true
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        INDENT_CONTENT_COMMAND,
        () => {
          return $handleIndentOutdentAsSuggestion('indent', addCreatedIDtoSet, suggestionModeLogger)
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        OUTDENT_CONTENT_COMMAND,
        () => {
          return $handleIndentOutdentAsSuggestion('outdent', addCreatedIDtoSet, suggestionModeLogger)
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        SELECTION_INSERT_CLIPBOARD_NODES_COMMAND,
        ({ nodes }) => {
          return $selectionInsertClipboardNodes(nodes, addCreatedIDtoSet, suggestionModeLogger)
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        (event) => {
          if (!isSuggestionMode) {
            return false
          }
          event.preventDefault()
          const selection = $getSelection()
          if ($isNodeSelection(selection)) {
            let handled = true
            editor.update(() => {
              // Try image first, then divider
              handled = $handleImageDeleteAsSuggestion(addCreatedIDtoSet, suggestionModeLogger)
              if (!handled) {
                handled = $handleDividerDeleteAsSuggestion(addCreatedIDtoSet, suggestionModeLogger)
              }
            })
            return handled
          }
          let handled = true
          editor.update(() => {
            handled = $handleDeleteInputType(
              editor,
              'deleteContentBackward',
              addCreatedIDtoSet,
              suggestionModeLogger,
              createNotification,
            )
          })
          return handled
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        (event) => {
          if (!isSuggestionMode) {
            return false
          }
          event.preventDefault()
          const selection = $getSelection()
          if ($isNodeSelection(selection)) {
            let handled = true
            editor.update(() => {
              // Try image first, then divider
              handled = $handleImageDeleteAsSuggestion(addCreatedIDtoSet, suggestionModeLogger)
              if (!handled) {
                handled = $handleDividerDeleteAsSuggestion(addCreatedIDtoSet, suggestionModeLogger)
              }
            })
            return handled
          }
          let handled = true
          editor.update(() => {
            handled = $handleDeleteInputType(
              editor,
              'deleteContentForward',
              addCreatedIDtoSet,
              suggestionModeLogger,
              createNotification,
            )
          })
          return handled
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        BEFOREINPUT_EVENT_COMMAND,
        (event) => {
          return $handleBeforeInputEvent(editor, event, addCreatedIDtoSet, suggestionModeLogger, createNotification)
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        PASTE_COMMAND,
        (event) => {
          const [, files, hasTextContent] = eventFiles(event)
          if (files.length > 0 && !hasTextContent) {
            const imageFiles = files.filter(isImageFile)
            if (imageFiles.length === 0) {
              return false
            }
            for (const file of imageFiles) {
              editor.dispatchCommand(INSERT_FILE_COMMAND, file)
            }
            return true
          }
          return false
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        KEY_DOWN_COMMAND,
        (event) => {
          const { key, shiftKey, ctrlKey, metaKey, altKey } = event
          const controlOrMeta = IS_APPLE ? metaKey : ctrlKey
          const lowerCaseKey = key.toLowerCase()

          const isUndo = lowerCaseKey === 'z' && !shiftKey && controlOrMeta
          const isRedo = IS_APPLE
            ? lowerCaseKey === 'z' && metaKey && shiftKey
            : (lowerCaseKey === 'y' && ctrlKey) || (lowerCaseKey === 'z' && ctrlKey && shiftKey)
          const isTab = key === 'Tab' && !altKey && !ctrlKey && !metaKey
          const isBold = key.toLowerCase() === 'b' && !altKey && controlOrMeta
          const isItalic = key.toLowerCase() === 'i' && !altKey && controlOrMeta
          const isUnderline = key.toLowerCase() === 'u' && !altKey && controlOrMeta

          if (isUndo) {
            event.preventDefault()
            return editor.dispatchCommand(UNDO_COMMAND, undefined)
          } else if (isRedo) {
            event.preventDefault()
            return editor.dispatchCommand(REDO_COMMAND, undefined)
          } else if (isTab) {
            return editor.dispatchCommand(KEY_TAB_COMMAND, event)
          } else if (isBold) {
            event.preventDefault()
            return editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')
          } else if (isItalic) {
            event.preventDefault()
            return editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')
          } else if (isUnderline) {
            event.preventDefault()
            return editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')
          }

          return false
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        (event) => {
          // Handle horizontal rule markdown shortcut (---, ***, ___)
          let shouldHandleHR = false
          let emptyListItem: ListItemNode | null = null
          
          editor.getEditorState().read(() => {
            const selection = $getSelection()
            
            // Check for HR shortcut
            const paragraphElement = $getTopLevelParagraphForHR(selection)
            if (paragraphElement) {
              const textContent = paragraphElement.getTextContent()
              if (HR.regExp.test(textContent)) {
                shouldHandleHR = true
                return
              }
            }
            
            // Check for empty list item
            if ($isRangeSelection(selection) && selection.isCollapsed()) {
              const anchorNode = selection.anchor.getNode()
              emptyListItem = $isEmptyListItemExceptForSuggestions(anchorNode)
            }
          })

          if (shouldHandleHR) {
            editor.update(() => {
              const selection = $getSelection()
              const paragraphElement = $getTopLevelParagraphForHR(selection)
              if (!paragraphElement) {
                return
              }

              // Remove the paragraph with the dashes
              paragraphElement.remove()

              // Insert the HR as a suggestion
              $insertDividerAsSuggestion(addCreatedIDtoSet)
            })

            event?.preventDefault()
            return true
          }

          if (emptyListItem) {
            // Handle Enter on empty list item - convert to paragraph as suggestion
            const suggestionID = generateUUID()
            editor.update(() => {
              // Re-check inside update since editor state may have changed
              const selection = $getSelection()
              if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
                return
              }
              const listItem = $isEmptyListItemExceptForSuggestions(selection.anchor.getNode())
              if (!listItem) {
                return
              }
              $handleInsertParagraphOnEmptyListItem(
                listItem,
                suggestionID,
                addCreatedIDtoSet,
                suggestionModeLogger,
              )
            })

            event?.preventDefault()
            return true
          }

          return false
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerUpdateListener(
        /**
         * Lexical's markdown shortcut plugin doesn't allow running element transformers if the parent
         * of the current text node is not a block-level element, so we handle that ourselves.
         */
        function handleElementMarkdownShortcuts({ editorState, prevEditorState, tags, dirtyLeaves }) {
          // We only want list shortcut to happen when the current user is actively typing
          // so we ignore updates created by other clients and the history manager.
          // If the editor is in composition mode that means it has potentially received input
          // from IME, in which we also want to ignore the update.
          const isCollaborativeUpdate = tags.has('collaboration')
          const isUndoOrRedoUpdate = tags.has('historic')
          const isInCompositionMode = editor.isComposing()
          const shouldSkipUpdate = isCollaborativeUpdate || isUndoOrRedoUpdate || isInCompositionMode
          if (shouldSkipUpdate) {
            return
          }

          const selection = editorState.read($getSelection)
          const prevSelection = prevEditorState.read($getSelection)

          if (!$isRangeSelection(selection) || !$isRangeSelection(prevSelection) || !selection.isCollapsed()) {
            return
          }

          const anchorKey = selection.anchor.key
          const anchorOffset = selection.anchor.offset
          const anchorNode = editorState._nodeMap.get(anchorKey)

          const cursorHasMovedMoreThanOneChar = anchorOffset !== 1 && anchorOffset > prevSelection.anchor.offset + 1

          if (!$isTextNode(anchorNode) || !dirtyLeaves.has(anchorKey) || cursorHasMovedMoreThanOneChar) {
            return
          }

          const hasCodeFormat = editorState.read(() => anchorNode.hasFormat('code'))
          if (hasCodeFormat) {
            return
          }

          const parent = editorState.read(() => anchorNode.getParent())
          if (!$isSuggestionNode(parent) || parent.getSuggestionTypeOrThrow() !== 'insert') {
            return
          }

          /**
           * Goes through the available markdown element transformers (lists, HR) and if the regexp
           * for one of them is matched then it runs that i.e converting a shortcut
           * like `- ` to the respective list, or `---` to a horizontal rule.
           */
          const $runMarkdownElementTransformers = () => {
            const textContent = anchorNode.getTextContent()

            const isNotPrecededBySpace = textContent[anchorOffset - 1] !== ' '
            if (isNotPrecededBySpace) {
              return
            }

            // Check for horizontal rule shortcut (---, ***, ___)
            const hrMatch = textContent.match(HR.regExp)
            if (hrMatch && hrMatch[0].length === anchorOffset) {
              const actualParent = parent.getParent()!
              const isActualParentBlockLevel = $isRootOrShadowRoot(actualParent.getParent())
              if (isActualParentBlockLevel) {
                // Remove the paragraph containing the dashes and the suggestion node
                actualParent.remove()
                // Insert the HR as a suggestion
                $insertDividerAsSuggestion(addCreatedIDtoSet)
                return
              }
            }

            // Check for blockquote shortcut (> )
            const quoteMatch = textContent.match(QUOTE.regExp)
            if (quoteMatch && quoteMatch[0].length === anchorOffset) {
              const actualParent = parent.getParent()!
              const isActualParentBlockLevel = $isRootOrShadowRoot(actualParent.getParent())
              if (isActualParentBlockLevel) {
                // Remove the "> " text
                const [leadingNode] = anchorNode.splitText(anchorOffset)
                leadingNode.remove()
                // Convert to blockquote as suggestion
                $setBlocksTypeAsSuggestion('quote', addCreatedIDtoSet, suggestionModeLogger)
                return
              }
            }

            for (const transformer of LIST_TRANSFORMERS) {
              const regExp = transformer.regExp
              const replace = transformer.replace

              const match = textContent.match(regExp)
              if (match && match[0].length === anchorOffset) {
                const actualParent = parent.getParent()!
                const isActualParentBlockLevel = $isRootOrShadowRoot(actualParent.getParent())
                // We don't want this to run if, for e.g, you type
                // `- ` at the start of a nested list item
                if (!isActualParentBlockLevel) {
                  break
                }
                const nextSiblings = parent.getNextSiblings()
                const [leadingNode] = anchorNode.splitText(anchorOffset)
                leadingNode.remove()
                const siblings = [parent, ...nextSiblings]
                replace(actualParent, siblings, match, false)
                break
              }
            }
          }

          editor.update($runMarkdownElementTransformers, {
            tag: 'suggestion-md-transform',
          })
        },
      ),
      editor.registerCommand(
        LINK_CHANGE_COMMAND,
        (payload) => {
          return $handleLinkChangeSuggestion(editor, payload, suggestionModeLogger, addCreatedIDtoSet)
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        INSERT_IMAGE_COMMAND,
        (payload: InsertImagePayload) => {
          const imageNode = $createImageNode(payload)
          return $selectionInsertClipboardNodes([imageNode], addCreatedIDtoSet, suggestionModeLogger)
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        SET_IMAGE_SIZE_COMMAND,
        (payload) => $handleImageSizeChangeAsSuggestion(payload, addCreatedIDtoSet, suggestionModeLogger),
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        SET_IMAGE_CAPTION_VISIBILITY_COMMAND,
        (payload) => $handleImageCaptionToggleAsSuggestion(payload, addCreatedIDtoSet, suggestionModeLogger),
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        DROP_COMMAND,
        (event) => $handleImageDragAndDropAsSuggestion(event, addCreatedIDtoSet, suggestionModeLogger),
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        INSERT_FILE_COMMAND,
        (payload) => insertImageFileAsSuggestion(editor, payload, addCreatedIDtoSet, suggestionModeLogger),
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        COMPOSITION_START_EVENT_COMMAND,
        /**
         * Since we cannot reliably capture and wrap content
         * inserted using IME, we disable suggestion mode if
         * the editor is composing and show an alert to the user.
         */
        function disableSuggestionModeIfComposing() {
          suggestionModeLogger.info('Editor is composing, disabling suggestion mode')
          editor.setEditable(false)
          editor._compositionKey = null
          onUserModeChange(EditorUserMode.Preview)
          createNotification({
            messageString: `The language you're using isn't currently supported in suggestion mode. Please switch to edit mode or change the language.`,
            type: 'error'
          })

          return true
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        INSERT_TABLE_COMMAND,
        (payload) => {
          return $insertNewTableAsSuggestion(payload, addCreatedIDtoSet)
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        DELETE_TABLE_COMMAND,
        (key) => {
          return $suggestTableDeletion(key, addCreatedIDtoSet, suggestionModeLogger)
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        INSERT_TABLE_ROW_COMMAND,
        ({ insertAfter }) => {
          return $insertNewTableRowAsSuggestion(insertAfter, addCreatedIDtoSet)
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        DELETE_TABLE_ROW_COMMAND,
        (row) => {
          return $suggestTableRowDeletion(row, addCreatedIDtoSet)
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        INSERT_TABLE_COLUMN_COMMAND,
        ({ insertAfter }) => {
          return $insertNewTableColumnAsSuggestion(insertAfter, addCreatedIDtoSet)
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        DELETE_TABLE_COLUMN_COMMAND,
        (cell) => {
          return $suggestTableColumnDeletion(cell, addCreatedIDtoSet)
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        INSERT_CHECK_LIST_COMMAND,
        () => {
          return $insertListAsSuggestion(editor, 'check', addCreatedIDtoSet, suggestionModeLogger)
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        INSERT_ORDERED_LIST_COMMAND,
        () => {
          return $insertListAsSuggestion(editor, 'number', addCreatedIDtoSet, suggestionModeLogger)
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        INSERT_UNORDERED_LIST_COMMAND,
        () => {
          return $insertListAsSuggestion(editor, 'bullet', addCreatedIDtoSet, suggestionModeLogger)
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        SET_BLOCK_TYPE_COMMAND,
        (blockType) => {
          return $setBlocksTypeAsSuggestion(blockType, addCreatedIDtoSet, suggestionModeLogger)
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        INSERT_HORIZONTAL_RULE_COMMAND,
        () => {
          return $insertDividerAsSuggestion(addCreatedIDtoSet)
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
    )
  }, [controller, createNotification, editor, isSuggestionMode, onUserModeChange, suggestionModeLogger])

  return null
}
