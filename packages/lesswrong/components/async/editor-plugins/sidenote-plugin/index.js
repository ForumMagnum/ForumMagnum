import EditorUtils from 'draft-js-plugins-utils'
import { Modifier, EditorState, SelectionState } from 'draft-js'
import DraftLocation from '../../DraftLocation'
import SidenoteButton from './SidenoteButton.jsx'
import sidenoteDecorator from './sidenoteDecorator'

let lockBackspace = false;

const isSidenoteSelected = (editorState) => {
  return EditorUtils.hasEntity(editorState, 'SIDENOTE');
}

const isSelectionEmpty = (editorState) => {
  return editorState.getSelection().isCollapsed();
}

const getSelectionEndNode = (browserSelection) => {
  const selection = browserSelection;

  if (selection.isCollapsed) {
    return selection.focusNode;
  }

  if (selection.focusNode === selection.anchorNode) {
    if (selection.focusOffset > selection.anchorOffset) {
      return selection.focusNode
    }
    return selection.anchorNode;
  }

  if (selection.focusNode.compareDocumentPosition(selection.anchorNode)
      & Node.DOCUMENT_POSITION_FOLLOWING) {
        // anchor comes after focus
        return selection.anchorNode;
  }

  return selection.focusNode;
}

const isElement = (node) => {
  return node instanceof Element;
}

const isNodeInSidenote = (node) => {
  const element = isElement(node) ?
    node :
    node.parentElement;

  if (!element) {
    return false;
  }

  return element.matches('.sidenote') ||
    element.closest('.sidenote') !== null;
}

const isEditingSidenote = () => {
  const browserSelection = window.getSelection();
  if (!browserSelection) {
    return false;
  }

  const endNode = getSelectionEndNode(browserSelection)
  if (endNode === null) {
    return false
  }

  return isNodeInSidenote(endNode);
}

const addToBeginningOfSidenote = (text, editorState, setEditorState) => {
  const sidenoteEntityKey = DraftLocation.fromEditorState(editorState).next().getEntityKey()
  const nextContentState = Modifier.replaceText(
    editorState.getCurrentContent(),
    editorState.getSelection(),
    text,
    null,
    sidenoteEntityKey
  )

  setEditorState(
    EditorState.push(
      editorState,
      nextContentState,
      'insert-characters'
    )
  )
}

const isCursorAtBeginningOfSidenote = (editorState) => {
  const cursorLocation = DraftLocation.fromEditorState(editorState)
  const cursorEntityType = cursorLocation.getEntityType()
  if (cursorEntityType !== 'SIDENOTE') {
    return false
  }

  const previousLocation = cursorLocation.previous()
  return previousLocation === null ||
    previousLocation.getEntityType() !== 'SIDENOTE';
}

const handleBeforeInput = (text, editorState, { setEditorState }) => {
  if (isSelectionEmpty(editorState)
      && isCursorAtBeginningOfSidenote(editorState)
      && isEditingSidenote()) {
    addToBeginningOfSidenote(text, editorState, setEditorState)

    console.log('Add text to beginning of sidenote')

    return 'handled';
  }
}

const hilightSidenote = (editorState, setEditorState) => {
  const cursorLocation = DraftLocation.fromEditorState(editorState)
  const characters = cursorLocation.getBlock().getCharacterList()
  const entityKey = cursorLocation.getEntityKey()
  const startOffset = cursorLocation.offset;
  let endOffset = startOffset;

  while (endOffset < characters.size &&
         characters.get(endOffset).getEntity() === entityKey) {
    endOffset++;
  }

  const nextSelection = new SelectionState({
    anchorKey: cursorLocation.blockKey,
    anchorOffset: startOffset,
    focusKey: cursorLocation.blockKey,
    focusOffset: endOffset,
    isBackward: false,
    hasFocus: editorState.getSelection().getHasFocus()
  });

  setEditorState(
    EditorState.forceSelection(editorState, nextSelection)
  )
}

const getPreviousTextNode = (node) => {
  // Gets the first text node to come before the given node

  // Start at the node's parent
  // Iterate through nodes in document order,
  // keeping track of the last text node seen
  // Stop once we get to the original node
  const iter = document.createNodeIterator(node.parentNode)
  let textNode = null
  let current = iter.nextNode()
  while (current !== null && current !== node) {
    if (current.nodeType === Node.TEXT_NODE) {
      textNode = current;
    }
    current = iter.nextNode()
  }

  return textNode;
}

const getSidenoteNode = (entityKey, editorRef) => {
  // Sidenotes have their entity-key attached to them as 'data-entity-key'
  // so that we can get their dom nodes here.
  // See Sidenote.jsx for where the entity-key is set.
  return editorRef.editor.querySelector(`[data-entity-key="${entityKey}"]`)
}

const moveCursorBeforeSidenote = (
  entityKey,
  previousLocation,
  setEditorState,
  getEditorState,
  getEditorRef
) => {
  lockBackspace = true
  // Clear the browser's selection
  window.getSelection().removeAllRanges()

  // Set the selection after the next render
  setTimeout(() => {
    const sidenoteNode = getSidenoteNode(entityKey, getEditorRef())
    const previousNode = getPreviousTextNode(sidenoteNode) || sidenoteNode
    window.getSelection().collapse(previousNode, previousNode.length)

    const newSelection = new SelectionState({
      anchorKey: previousLocation.blockKey,
      anchorOffset: previousLocation.offset,
      focusKey: previousLocation.blockKey,
      focusOffset: previousLocation.offset,
      isBackward: false,
      hasFocus: true
    })

    setEditorState(
      EditorState.acceptSelection(
        getEditorState(),
        newSelection
      )
    )

    lockBackspace = false
  }, 0)
}

// Remove the selected characters
// Has special logic to move the cursor to before the sidenote
// otherwise the cursor would be moved inside the sidenote after the deletion
const removeSelectionBeforeSidenote = (
  editorState,
  setEditorState,
  getEditorState,
  getEditorRef
) => {
  const selection = editorState.getSelection()
  const location = DraftLocation.fromEditorState(editorState, 'start')
  const previousLocation = location.previous()

  if (previousLocation === null) {
    // Stick with default behavior
    // if we're removing the first character in the document
    return 'not-handled'
  }

  const rangeToRemove = new SelectionState({
    anchorKey: previousLocation.blockKey,
    anchorOffset: previousLocation.offset,
    focusKey: selection.getStartKey(),
    focusOffset: selection.getStartOffset(),
    isBackward: false,
    hasFocus: false // temporarily disable the cursor - we will update its position after rendering
  })

  const nextEditorState = EditorState.push(
    editorState,
    Modifier.removeRange(
      editorState.getCurrentContent(),
      rangeToRemove,
      'backward'
    ),
    selection.isCollapsed() ? 'backspace-character' : 'remove-range'
  )

  if (selection.getHasFocus()) {
    moveCursorBeforeSidenote(
      location.getEntityKey(),
      previousLocation,
      setEditorState,
      getEditorState,
      getEditorRef
    )
  }

  setEditorState(nextEditorState)

  return 'handled'
}

const handleBackspace = (editorState, setEditorState, getEditorState, getEditorRef) => {
  if (isCursorAtBeginningOfSidenote(editorState)) {
    if (isEditingSidenote()) {
      if (lockBackspace) {
        console.log('Backspace locked')
        return 'handled'
      }
      console.log('Hilight entire sidenote')
      hilightSidenote(editorState, setEditorState)

      return 'handled'
    } else {
      return removeSelectionBeforeSidenote(
        editorState,
        setEditorState,
        getEditorState,
        getEditorRef
      )
    }
  }
}

const handleKeyCommand = (command, editorState, { setEditorState, getEditorState, getEditorRef }) => {
  if (command === 'backspace') {
    return handleBackspace(editorState, setEditorState, getEditorState, getEditorRef)
  }
}

/**
 * Ignore 'enter' key presses while the cursor is in a sidenote.
 *
 * Otherwise draft will break the sidenote into two sidenotes.
 */
const handleReturn = (event, editorState) => {
  if (isSidenoteSelected(editorState)) {
    return 'handled'
  }
}

const createSidenotePlugin = () => {
  return {
    decorators: [ sidenoteDecorator ],
    handleReturn,
    handleBeforeInput,
    handleKeyCommand,
    SidenoteButton
  };
};

export default createSidenotePlugin
