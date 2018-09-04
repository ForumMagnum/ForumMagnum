/**
 * Represents a single 'character' inside the draft text editor.
 *
 * A location in draft is defined by a block and offset.
 * Provides convenience functions for working with locations.
 */
class DraftLocation {

  constructor(contentState, blockKey, offset) {
    this.contentState = contentState;
    this.blockKey = blockKey;
    this.offset = offset;
  }

  static fromSelection(contentState, selection, position = 'end') {
    return new DraftLocation(
      contentState,
      position === 'end' ? selection.getEndKey() : selection.getStartKey(),
      position === 'end' ? selection.getEndOffset() : selection.getStartOffset()
    )
  }

  static fromEditorState(editorState, position = 'end') {
    return DraftLocation.fromSelection(
      editorState.getCurrentContent(),
      editorState.getSelection(),
      position
    )
  }

  getBlock() {
    return this.contentState.getBlockForKey(this.blockKey)
  }

  getCharacter() {
    return this.getBlock.getText()[this.offset]
  }

  next() {
    const block = this.getBlock()
    const nextOffset = this.offset + 1;
    if (nextOffset < block.getLength()) {
      return new DraftLocation(this.contentState, this.blockKey, nextOffset)
    }

    const nextBlockKey = this.contentState.getKeyAfter(this.blockKey)
    if (!nextBlockKey) {
      return null;
    }

    return new DraftLocation(this.contentState, nextBlockKey, 0)
  }

  previous() {
    const previousOffset = this.offset - 1;
    if (previousOffset > 0) {
      return new DraftLocation(this.contentState, this.blockKey, previousOffset)
    }

    const previousBlock = this.contentState.getBlockBefore(this.blockKey)
    if (!previousBlock) {
      return null;
    }

    const previousBlockKey = this.contentState.getKeyBefore(this.blockKey)
    return new DraftLocation(this.contentState, previousBlockKey, previousBlock.getLength() - 1)
  }

  getEntityKey() {
    return this.getBlock().getEntityAt(this.offset)
  }

  getEntity() {
    const key = this.getEntityKey();
    return key === null ?
      null :
      this.contentState.getEntity(key)
  }

  getEntityType() {
    const entity = this.getEntity()
    return entity === null ?
      null :
      entity.getType()
  }
}

export default DraftLocation;
