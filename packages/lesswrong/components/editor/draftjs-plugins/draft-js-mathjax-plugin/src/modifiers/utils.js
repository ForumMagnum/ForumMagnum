import { SelectionState, ContentState, EditorState, Modifier } from 'draft-js'
import { Map } from 'immutable'

export function isAtEndOfBlock(contentState, selection) {
  const currentBlockKey = selection.getAnchorKey()
  const currentBlock = contentState.getBlockForKey(currentBlockKey)
  return currentBlock.getText().length === selection.getStartOffset()
}

export function isAtEndOfContent(contentState, selection) {
  if (!isAtEndOfBlock(contentState, selection)) { return false }
  const currentBlockKey = selection.getAnchorKey()
  const lastBlockKey = contentState.getLastBlock().getKey()
  return currentBlockKey === lastBlockKey
}

export function isCurrentBlockEmpty(contentState, selection) {
  const currentBlockKey = selection.getAnchorKey()
  const currentBlock = contentState.getBlockForKey(currentBlockKey)
  return currentBlock.getText().length === 0
}

export function getNewBlockSelection(blockBefore, blockAfter, after) {
  if (!blockAfter && !blockBefore) { return undefined }
  let nextBlock
  let offset

  if (after) {
    nextBlock = blockAfter || blockBefore
    offset = blockAfter ? 0 : nextBlock.getLength()
  } else {
    nextBlock = blockBefore || blockAfter
    offset = blockBefore ? nextBlock.getLength() : 0
  }

  return SelectionState
      .createEmpty(nextBlock.getKey())
      .merge({
        anchorOffset: offset,
        focusOffset: offset,
        hasFocus: true,
      })
}

export function removeBlock(contentState, block, after = 1) {
  const blockMap = contentState.getBlockMap()
  const blockKey = block.getKey()
  const blockAfter = contentState.getBlockAfter(blockKey)
  const blockBefore = contentState.getBlockBefore(blockKey)

  if (!blockAfter && !blockBefore) {
    // peut mieux faire ...
    if (block.getType() === 'atomic' && block.getData().mathjax /* ['mathjax'] */) {
      return ContentState.createFromText('')
    }
    return contentState
  }

  const newBlockMap = blockMap.delete(blockKey)
  return contentState
    .set('blockMap', newBlockMap)
    .set('selectionAfter', getNewBlockSelection(
      blockBefore, blockAfter, after,
    ))
}

export function removeEntity(contentState, blockKey, start, end) {
  const selToRemove = SelectionState
    .createEmpty(blockKey)
    .merge({
      anchorOffset: start,
      focusOffset: end,
    })

  return Modifier.removeRange(
    contentState,
    selToRemove,
    'backward',
  )
}

export function finishEdit(store) {
  return (newContentState, newSelection, needRemove) => {
    store.setReadOnly(false)
    const newEditorState = EditorState.push(
      store.getEditorState(),
      newContentState,
      needRemove ? 'remove-range' : 'update-math',
    )

    if (newSelection !== undefined) {
      store.setEditorState(
        EditorState.forceSelection(
          newEditorState, newSelection,
        ),
      )
      setTimeout(() => store.getEditorRef().focus(), 5)
    } else {
      store.setEditorState(newEditorState)
    }
  }
}

function _saveInlineTeX({
  after,
  contentState,
  teX,
  displaystyle,
  entityKey,
  blockKey,
  startPos,
}) {
  const needRemove = teX.length === 0
  let newContentState
  let newSelection

  if (needRemove) {
    newContentState = removeEntity(
      contentState, blockKey, startPos, startPos + 1,
    )
    newSelection = newContentState.getSelectionAfter()
  } else {
    newContentState = contentState.mergeEntityData(
      entityKey, { teX, displaystyle },
    )

    if (after !== undefined) {
      const offset = after ? startPos + 2 : startPos
      newSelection = SelectionState.createEmpty(blockKey)
        .merge({
          anchorOffset: offset,
          focusOffset: offset,
          hasFocus: true,
        })
    }
  }

  return [newContentState, newSelection, needRemove]
}

function _saveBlockTeX({
  after,
  contentState,
  teX,
  block,
}) {
  const needRemove = teX.length === 0
  const blockKey = block.getKey()

  let newContentState
  let newSelection

  if (needRemove) {
    newContentState = removeBlock(
      contentState, block, after,
    )
    newSelection = newContentState.getSelectionAfter()
  } else {
    newContentState = Modifier.mergeBlockData(
      contentState,
      SelectionState.createEmpty(blockKey),
      Map({ teX }),
    )

    if (after !== undefined) {
      newSelection = getNewBlockSelection(
        contentState.getBlockBefore(blockKey),
        contentState.getBlockAfter(blockKey),
        after,
      )
    }
  }

  return [newContentState, newSelection, needRemove]
}

export function saveTeX({
  block,
  entityKey,
  displaystyle,
  blockKey,
  startPos,
  ...common
}) {
  return entityKey ?
    _saveInlineTeX({ ...common, entityKey, displaystyle, blockKey, startPos }) :
    _saveBlockTeX({ ...common, block })
}
