'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _draftJs = require('draft-js');

var leaveList = function leaveList(editorState) {
  var contentState = editorState.getCurrentContent();
  var selection = editorState.getSelection();
  var key = selection.getStartKey();
  var currentBlock = contentState.getBlockForKey(key);
  var type = currentBlock.getType();
  return _draftJs.RichUtils.toggleBlockType(editorState, type);
};

exports.default = leaveList;