import { Modifier, genKey, EditorState, ContentBlock, BlockMapBuilder } from 'draft-js'
// import { List, Repeat } from 'immutable'
import { isAtEndOfBlock, isAtEndOfContent, isCurrentBlockEmpty } from './utils'

export default function customInsertAtomicBlock(
  editorState,
  data,
  // character = ' ',
) {
  const contentState = editorState.getCurrentContent()
  const selectionState = editorState.getSelection()

  const afterRemoval = Modifier.removeRange(
    contentState,
    selectionState,
    'backward',
  )

  const targetSelection = afterRemoval.getSelectionAfter()

  const currentBlockEmpty = isCurrentBlockEmpty(afterRemoval, targetSelection)
  const atEndOfBlock = isAtEndOfBlock(afterRemoval, targetSelection)
  const atEndOfContent = isAtEndOfContent(afterRemoval, targetSelection)

  // Ne pas diviser un bloc vide, sauf s'il est à la fin du contenu
  const afterSplit = !currentBlockEmpty || atEndOfContent ?
    Modifier.splitBlock(afterRemoval, targetSelection) :
    afterRemoval
  const insertionTarget = afterSplit.getSelectionAfter()

  const asAtomicBlock = Modifier.setBlockType(
    afterSplit,
    insertionTarget,
    'atomic',
  )

  // const charData = CharacterMetadata.create({entity: entityKey})
  // const charData = CharacterMetadata.create()

  const fragmentArray = [
    new ContentBlock({
      key: genKey(),
      type: 'atomic',
      // text: character,
      // characterList: List(Repeat(charData, character.length)),
      data,
    }),
  ]

  if (!atEndOfBlock || atEndOfContent) {
    // Pour éviter l'insertion d'un bloc vide inutile dans
    // le cas où le curseur est la fin d'un bloc
    fragmentArray.push(new ContentBlock({
      key: genKey(),
      type: 'unstyled',
      // text: '',
      // characterList: List(),
    }))
  }

  const fragment = BlockMapBuilder.createFromArray(fragmentArray)

  const withAtomicBlock = Modifier.replaceWithFragment(
    asAtomicBlock,
    insertionTarget,
    fragment,
  )

  const newContent = withAtomicBlock.merge({
    selectionBefore: selectionState,
    selectionAfter: withAtomicBlock.getSelectionAfter().set('hasFocus', false),
  })

  return EditorState.push(editorState, newContent, 'insert-fragment')
}
