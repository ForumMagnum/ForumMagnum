'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _draftJs = require('draft-js');

var changeCurrentBlockType = function changeCurrentBlockType(editorState, type, text) {
  var blockMetadata = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

  var currentContent = editorState.getCurrentContent();
  var selection = editorState.getSelection();
  var key = selection.getStartKey();
  var blockMap = currentContent.getBlockMap();
  var block = blockMap.get(key);
  var data = block.getData().merge(blockMetadata);
  var newBlock = block.merge({ type: type, data: data, text: text || '' });
  var newSelection = selection.merge({
    anchorOffset: 0,
    focusOffset: 0
  });
  var newContentState = currentContent.merge({
    blockMap: blockMap.set(key, newBlock),
    selectionAfter: newSelection
  });
  return _draftJs.EditorState.push(editorState, newContentState, 'change-block-type');
};

exports.default = changeCurrentBlockType;