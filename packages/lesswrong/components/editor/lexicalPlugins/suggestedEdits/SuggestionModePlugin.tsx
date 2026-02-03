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
import { UNORDERED_LIST, ORDERED_LIST, CHECK_LIST } from '@lexical/markdown'
import { $acceptSuggestion } from './acceptSuggestion'
import { $rejectSuggestion } from './rejectSuggestion'
import { $handleBeforeInputEvent, $handleDeleteInputType } from './handleBeforeInputEvent'
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
import { EditorUserMode, type EditorUserModeType } from '@/components/editor/lexicalPlugins/suggestions/EditorUserMode'
import { $handleIndentOutdentAsSuggestion } from './handleIndentOutdent'
import { useGenericAlertModal } from '@/lib/vendor/proton/alertModal'
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
import { INSERT_CHECK_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list'
import { SET_BLOCK_TYPE_COMMAND } from '@/components/editor/lexicalPlugins/suggestions/blockTypeSuggestionUtils'
import { $setBlocksTypeAsSuggestion } from './setBlocksTypeAsSuggestion'
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode'
import { $insertDividerAsSuggestion } from './insertDividerAsSuggestion'
import { $setElementAlignmentAsSuggestion } from './setElementAlignmentAsSuggestion'
import { useNotifications } from '@/lib/vendor/proton/notifications'
import { $insertListAsSuggestion } from './insertListAsSuggestion'
import { eventFiles } from '@lexical/rich-text'
import { $createImageNode } from '@/components/lexical/nodes/ImageNode'
import { isImageFile } from '@/components/lexical/plugins/ImagesPlugin/ImageUtils'
import { ImageUploadError, uploadToCloudinary } from '@/components/lexical/utils/cloudinaryUpload'

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

  const { createNotification } = useNotifications()
  const [alertModal, showAlertModal] = useGenericAlertModal()

  /**
   * Set of suggestion IDs created during the current session.
   * When the mutation listener for suggestion nodes is triggered,
   * we check this set to see whether a new thread should be created.
   * Once a thread is created, we remove that suggestion ID from this set.
   */
  const createdSuggestionIDsRef = useRef(new Set<string>())

  useEffect(() => {
    /**
     * Temporary map of suggestion node keys to their suggestion ID,
     * used to get the ID for a key when that node is destroyed.
     */
    const suggestionNodeKeysToIDMap = new Map<NodeKey, SuggestionID>()

    return mergeRegister(
      /**
       * This listener creates/updates the ID->Set<NodeKey> relations
       * stored in the mark node map which are used for the hover/active
       * states of the suggestion nodes and their related thread.
       */
      editor.registerMutationListener(ProtonNode, (mutations) => {
        const createdSuggestionIDs = createdSuggestionIDsRef.current
        const idsToCreateCommentsFor: string[] = []

        editor.read(() => {
          for (const [key, mutation] of mutations) {
            const node = $getNodeByKey(key)

            let id: string = ''
            if (mutation === 'destroyed') {
              id = suggestionNodeKeysToIDMap.get(key) || ''
            } else if ($isSuggestionNode(node)) {
              id = node.getSuggestionIdOrThrow()
            }

            let suggestionNodeKeys = markNodeMap.get(id)
            suggestionNodeKeysToIDMap.set(key, id)

            if (mutation === 'destroyed') {
              if (!suggestionNodeKeys) {
                return
              }
              // One of the nodes for an ID is destroyed so we remove the key for it from the existing set.
              suggestionNodeKeys.delete(key)
              // If the set doesn't have any keys remaining, then we remove the ID from the mark node map
              // as no more nodes existing for that suggestion.
              if (suggestionNodeKeys.size === 0) {
                markNodeMap.delete(id)
              }
            } else {
              // No suggestion node for the given ID existed before.
              // If this suggestion was created in this session then we also create a thread for it.
              if (!suggestionNodeKeys) {
                suggestionNodeKeys = new Set()
                markNodeMap.set(id, suggestionNodeKeys)
                if (createdSuggestionIDs.has(id)) {
                  idsToCreateCommentsFor.push(id)
                }
              }
              // Existing set of node keys for this ID doesn't contain this key
              if (!suggestionNodeKeys.has(key)) {
                suggestionNodeKeys.add(key)
              }
            }
          }
        })

        for (const id of idsToCreateCommentsFor) {
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
      }),
    )
  }, [controller, editor, markNodeMap, suggestionModeLogger])

  /**
   * Refs for serialized reconciliation - ensures only one reconciliation runs at a time
   * and schedules another if changes occur during reconciliation.
   */
  const reconcileInProgressRef = useRef(false)
  const reconcilePendingRef = useRef(false)
  
  /**
   * Track suggestions that are currently being resolved (accepted/rejected).
   * This prevents race conditions where reconciliation runs before the
   * thread status update completes.
   */
  const pendingResolutionsRef = useRef(new Set<string>())

  useEffect(() => {
    /**
     * Reconcile suggestion threads with editor state.
     * This is the single source of truth reconciliation:
     * - If suggestion nodes exist for a thread -> thread should be 'open'
     * - If suggestion nodes don't exist and thread is 'open' -> archive/delete (implicit deletion)
     * - If suggestion nodes don't exist and thread is 'accepted'/'rejected' -> leave as-is
     */
    const reconcileSuggestionThreads = async () => {
      if (reconcileInProgressRef.current) {
        reconcilePendingRef.current = true
        return
      }
      reconcileInProgressRef.current = true

      try {
        // If we are collaborative and not yet synced, we shouldn't make decisions about creating/deleting threads
        // based on the absence of threads, because we might just not have received them yet.
        if (commentStore.isCollaborative() && !commentStore.isSynced()) {
          return
        }

        // Get suggestion IDs from current editor state
        const openSuggestionIDs = editor.getEditorState().read(() => {
          const nodes = $nodesOfType(ProtonNode).filter($isSuggestionNode)
          return new Set(nodes.map((node) => node.getSuggestionIdOrThrow()))
        })

        // Get all suggestion threads
        const threads = await controller.getAllThreads()
        const threadByMarkId = new Map(threads.map((thread) => [thread.markID, thread]))

        // For each suggestion with nodes in editor, ensure thread exists, is open, and has up-to-date summary
        for (const suggestionID of openSuggestionIDs) {
          const thread = threadByMarkId.get(suggestionID)
          const summary = generateSuggestionSummary(editor, markNodeMap, suggestionID)
          const content = JSON.stringify(summary)
          
          if (!thread) {
            // Create thread for suggestion that doesn't have one
            const summaryType = summary[0]?.type ?? 'insert'
            suggestionModeLogger.info(`Creating thread for suggestion ${suggestionID} based on editor state`)
            await controller.createSuggestionThread(suggestionID, content, summaryType).catch(reportError)
          } else {
            if (thread.status !== 'open') {
              // Nodes exist but thread is resolved -> undo happened -> reopen
              suggestionModeLogger.info(`Reopening thread ${thread.id} for suggestion ${suggestionID} (undo detected)`)
              await controller.reopenSuggestion(thread.id).catch(reportError)
            }
            // Update summary in case content changed
            await controller.updateSuggestionSummary(suggestionID, content).catch(reportError)
          }
        }

        // For each thread without nodes, handle based on current status
        for (const thread of threads) {
          if (openSuggestionIDs.has(thread.markID)) {
            continue
          }
          
          // Skip threads that are currently being resolved (accept/reject in progress)
          if (pendingResolutionsRef.current.has(thread.markID)) {
            continue
          }

          // No nodes for this thread
          if (thread.status === 'open' || thread.status === undefined) {
            // Was open, now no nodes -> implicit deletion (not explicit accept/reject)
            if (thread.hasChildComments) {
              suggestionModeLogger.info(`Archiving thread ${thread.id} with comments (no matching suggestion)`)
              await controller.setThreadStatus(thread.id, 'archived').catch(reportError)
            } else {
              suggestionModeLogger.info(`Deleting thread ${thread.id} (no matching suggestion, no comments)`)
              await controller.deleteSuggestionThread(thread.id).catch(reportError)
            }
          }
          // If status is 'accepted', 'rejected', or 'archived' -> leave as-is
        }
      } catch (error) {
        reportError(error)
      } finally {
        reconcileInProgressRef.current = false
        if (reconcilePendingRef.current) {
          reconcilePendingRef.current = false
          // Run again with fresh state
          void reconcileSuggestionThreads()
        }
      }
    }

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
          const handled = $acceptSuggestion(suggestionID)
          if (handled) {
            // Track that this suggestion is being resolved to prevent race with reconciliation
            pendingResolutionsRef.current.add(suggestionID)
            controller.getAllThreads().then((threads) => {
              const thread = threads.find((t) => t.markID === suggestionID)
              if (thread) {
                return controller.setThreadStatus(thread.id, 'accepted')
              }
            }).catch(reportError).finally(() => {
              pendingResolutionsRef.current.delete(suggestionID)
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
          const handled = $rejectSuggestion(suggestionID)
          if (handled) {
            // Track that this suggestion is being resolved to prevent race with reconciliation
            pendingResolutionsRef.current.add(suggestionID)
            // Set thread status directly - this persists to Yjs via CommentStore
            controller.getAllThreads().then((threads) => {
              const thread = threads.find((t) => t.markID === suggestionID)
              if (thread) {
                return controller.setThreadStatus(thread.id, 'rejected')
              }
            }).catch(reportError).finally(() => {
              pendingResolutionsRef.current.delete(suggestionID)
            })
          }
          return handled
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerUpdateListener(
        /**
         * Keep suggestion threads in sync with suggestion nodes present in the editor.
         * Uses serialized reconciliation to avoid race conditions.
         */
        function syncSuggestionThreadsFromEditor() {
          void reconcileSuggestionThreads()
        },
      ),
      editor.registerNodeTransform(ProtonNode, function cleanupEmptySuggestionNodes(node) {
        if (!$isSuggestionNode(node)) {
          return
        }
        const type = node.getSuggestionTypeOrThrow()
        if (SuggestionTypesThatCanBeEmpty.includes(type)) {
          return
        }
        if (node.getChildrenSize() === 0) {
          const id = node.getSuggestionIdOrThrow()
          suggestionModeLogger.info('Removing empty suggestion node', id, type)
          node.remove()
        }
      }),
      commentStore.registerOnChange(() => {
        void reconcileSuggestionThreads()
      }),
    )
  }, [controller, editor, isSuggestionMode, markNodeMap, onUserModeChange, suggestionModeLogger, commentStore])

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
              handled = $handleImageDeleteAsSuggestion(addCreatedIDtoSet, suggestionModeLogger)
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
              handled = $handleImageDeleteAsSuggestion(addCreatedIDtoSet, suggestionModeLogger)
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
           * Goes through the available markdown list transformers and if the regexp
           * for one of them is matched then it runs that i.e converting a shortcut
           * like `- ` to the respective list.
           */
          const $runMarkdownListTransformers = () => {
            const textContent = anchorNode.getTextContent()

            const isNotPrecededBySpace = textContent[anchorOffset - 1] !== ' '
            if (isNotPrecededBySpace) {
              return
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

          editor.update($runMarkdownListTransformers, {
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
          showAlertModal({
            title: 'Language not supported',
            translatedMessage:
              "The language you're using isn’t currently supported in suggestion mode. Please switch to edit mode or change the language.",
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
  }, [controller, createNotification, editor, isSuggestionMode, onUserModeChange, showAlertModal, suggestionModeLogger])

  return <>{alertModal}</>
}
