'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _draftJs = require('draft-js');

var changeCurrentInlineStyle = function changeCurrentInlineStyle(editorState, matchArr, style) {
  var currentContent = editorState.getCurrentContent();
  var selection = editorState.getSelection();
  var key = selection.getStartKey();
  var index = matchArr.index;

  var blockMap = currentContent.getBlockMap();
  var block = blockMap.get(key);
  var currentInlineStyle = block.getInlineStyleAt(index).merge();
  var newStyle = currentInlineStyle.merge([style]);
  var focusOffset = index + matchArr[0].length;
  var wordSelection = _draftJs.SelectionState.createEmpty(key).merge({
    anchorOffset: index,
    focusOffset: focusOffset
  });
  var newContentState = _draftJs.Modifier.replaceText(currentContent, wordSelection, matchArr[1], newStyle);
  newContentState = _draftJs.Modifier.insertText(newContentState, newContentState.getSelectionAfter(), ' ');
  var newEditorState = _draftJs.EditorState.push(editorState, newContentState, 'change-inline-style');
  return _draftJs.EditorState.forceSelection(newEditorState, newContentState.getSelectionAfter());
};

exports.default = changeCurrentInlineStyle;
