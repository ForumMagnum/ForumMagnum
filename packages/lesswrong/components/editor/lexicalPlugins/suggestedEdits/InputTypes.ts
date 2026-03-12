// List of all input types: https://w3c.github.io/input-events/#interface-InputEvent-Attributes

export const DeleteInputTypes = [
  'deleteContent',
  'deleteContentBackward',
  'deleteContentForward',
  'deleteWordBackward',
  'deleteWordForward',
  'deleteHardLineBackward',
  'deleteSoftLineBackward',
  'deleteHardLineForward',
  'deleteSoftLineForward',
  'deleteByDrag',
  'deleteByCut',
  'deleteByComposition',
]

export const InsertionInputTypes = [
  'insertText',
  'insertTranspose',
  'insertFromYank',
  'insertFromDrop',
  'insertReplacementText',
  'insertFromComposition',
  'insertLineBreak',
  // Note: 'insertParagraph' is intentionally omitted here. Enter key handling
  // (which produces 'insertParagraph' beforeinput events) is handled directly
  // in SuggestionModePlugin's KEY_ENTER_COMMAND handler at CRITICAL priority,
  // which prevents the beforeinput event from ever firing.
  'insertFromPaste',
  'insertFromPasteAsQuotation',
]
