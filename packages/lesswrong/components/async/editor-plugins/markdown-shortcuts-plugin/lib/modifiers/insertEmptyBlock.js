'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _draftJs = require('draft-js');

var _immutable = require('immutable');

var insertEmptyBlock = function insertEmptyBlock(editorState) {
  var blockType = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'unstyled';
  var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  var contentState = editorState.getCurrentContent();
  var selection = editorState.getSelection();
  var key = selection.getStartKey();
  var currentBlock = contentState.getBlockForKey(key);
  var emptyBlockKey = (0, _draftJs.genKey)();
  var emptyBlock = new _draftJs.ContentBlock({
    characterList: (0, _immutable.List)(),
    depth: 0,
    key: emptyBlockKey,
    text: '',
    type: blockType,
    data: (0, _immutable.Map)().merge(data)
  });
  var blockMap = contentState.getBlockMap();
  var blocksBefore = blockMap.toSeq().takeUntil(function (value) {
    return value === currentBlock;
  });
  var blocksAfter = blockMap.toSeq().skipUntil(function (value) {
    return value === currentBlock;
  }).rest();
  var augmentedBlocks = [[currentBlock.getKey(), currentBlock], [emptyBlockKey, emptyBlock]];
  var newBlocks = blocksBefore.concat(augmentedBlocks, blocksAfter).toOrderedMap();
  var focusKey = emptyBlockKey;
  var newContentState = contentState.merge({
    blockMap: newBlocks,
    selectionBefore: selection,
    selectionAfter: selection.merge({
      anchorKey: focusKey,
      anchorOffset: 0,
      focusKey: focusKey,
      focusOffset: 0,
      isBackward: false
    })
  });
  return _draftJs.EditorState.push(editorState, newContentState, 'split-block');
};

exports.default = insertEmptyBlock;