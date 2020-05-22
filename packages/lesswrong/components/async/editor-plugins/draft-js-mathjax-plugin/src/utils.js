import {
  getDefaultKeyBinding,
  KeyBindingUtil,
  EditorState,
  // convertToRaw,
} from 'draft-js'

const { hasCommandModifier } = KeyBindingUtil

export const myKeyBindingFn = getEditorState => (e) => {
  // J'aurais préféré CTRL+$ que CTRL+M, mais cela semble
  // un peu compliqué car chrome gère mal e.key.
  // if (e.key === '$' && hasCommandModifier(e))
  if (e.keyCode === /* m */ 77 && hasCommandModifier(e)) {
    return 'insert-texblock'
  }
  if (e.key === /* $ */ '$' /* && hasCommandModifier(e)*/) {
    const c = getEditorState().getCurrentContent()
    const s = getEditorState().getSelection()
    if (!s.isCollapsed()) return 'insert-inlinetex'
    const bk = s.getStartKey()
    const b = c.getBlockForKey(bk)
    const offset = s.getStartOffset() - 1
    if (b.getText()[offset] === '\\') {
      return `insert-char-${e.key}`
    }
    return 'insert-inlinetex'
  }
  // if (e.key === '*') {
  //   return 'test'
  // }
  // gestion du cursor au cas où il est situé près d'une formule
  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    const d = e.key === 'ArrowRight' ? 'r' : 'l'
    const s = getEditorState().getSelection()
    const c = getEditorState().getCurrentContent()
    if (!s.isCollapsed()) { return undefined }
    const offset = s.getStartOffset()
    const blockKey = s.getStartKey()
    const cb = c.getBlockForKey(blockKey)
    if (cb.getLength() === offset && d === 'r') {
      const b = c.getBlockAfter(blockKey)
      if (b && b.getType() === 'atomic' && b.getData().get('mathjax')) { return `update-texblock-${d}-${b.getKey()}` }
    }
    if (offset === 0 && d === 'l') {
      const b = c.getBlockBefore(blockKey)
      if (b && b.getType() === 'atomic' && b.getData().get('mathjax')) { return `update-texblock-${d}-${b.getKey()}` }
    }
    const ek = cb.getEntityAt(offset - (e.key === 'ArrowLeft' ? 1 : 0))
    if (ek && c.getEntity(ek).getType() === 'INLINETEX') {
      return `update-inlinetex-${d}-${ek}`
    }
  }

  return getDefaultKeyBinding(e)
}

export function findInlineTeXEntities(contentBlock, callback, contentState) {
  contentBlock.findEntityRanges(
    (character) => {
      const entityKey = character.getEntity()
      return (
        entityKey !== null &&
        contentState.getEntity(entityKey).getType() === 'INLINETEX'
      )
    },
    callback,
  )
}

export function changeDecorator(editorState, decorator) {
  return EditorState.create({
    allowUndo: true,
    currentContent: editorState.getCurrentContent(),
    decorator,
    selection: editorState.getSelection(),
  })
}
