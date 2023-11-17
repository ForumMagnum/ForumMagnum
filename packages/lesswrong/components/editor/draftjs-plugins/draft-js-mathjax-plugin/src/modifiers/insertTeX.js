import {
  Modifier,
  EditorState,
} from 'draft-js'
import { Map } from 'immutable'
import customInsertAtomicBlock from './customInsertAtomicBlock'
import { isAtEndOfBlock } from './utils'

function insertInlineTeX(editorState) {
  let contentState = editorState.getCurrentContent()
  let selection = editorState.getSelection()

  let teX = ''

  // si la selection est étendue, utiliser le texte sélectionné
  // pour initialiser la formule
  if (!selection.isCollapsed()) {
    const blockKey = selection.getStartKey()
    if (blockKey === selection.getEndKey()) {
      teX = contentState.getBlockForKey(blockKey)
        .getText()
        .slice(
          selection.getStartOffset(),
          selection.getEndOffset(),
        )
    }
    contentState = Modifier.removeRange(
      contentState,
      selection,
      'backward',
    )
    selection = contentState.getSelectionAfter()
  }


  contentState = contentState.createEntity(
    'INLINETEX',
    'IMMUTABLE',
    {
      teX,
      displaystyle: false,
    },
  )
  const entityKey = contentState.getLastCreatedEntityKey()

  // insérer un espace si le curseur se trouve au début ou à la fin
  // d'un bloc
  const atBeginOfBlock = selection.getStartOffset() === 0
  const atEndOfBlock = isAtEndOfBlock(contentState, selection)

  if (atBeginOfBlock) {
    contentState = Modifier.insertText(
      contentState,
      selection,
      ' ',
    )
    selection = contentState.getSelectionAfter()
  }

  contentState = Modifier.insertText(
    contentState,
    selection,
    '\t\t',
    undefined,
    entityKey,
  )
  selection = contentState.getSelectionAfter()

  if (atEndOfBlock) {
    contentState = Modifier.insertText(
      contentState,
      selection,
      ' ',
    )
  }

  return EditorState.push(
      editorState,
      contentState,
      'apply-entity',
    )
}

function insertTeXBlock(editorState) {
  return customInsertAtomicBlock(
      editorState, Map({ mathjax: true, teX: '' }),
    )
}

export default function insertTeX(editorState, block = false) {
  if (block) { return insertTeXBlock(editorState) }
  return insertInlineTeX(editorState)
}

