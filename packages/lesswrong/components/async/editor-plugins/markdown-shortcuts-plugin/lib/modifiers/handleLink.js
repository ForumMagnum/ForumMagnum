'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _insertLink = require('./insertLink');

var _insertLink2 = _interopRequireDefault(_insertLink);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var handleLink = function handleLink(editorState, character) {
  var re = /\[([^\]]+)]\(([^)"]+)(?: "([^"]+)")?\)/g;
  var key = editorState.getSelection().getStartKey();
  var text = editorState.getCurrentContent().getBlockForKey(key).getText();
  var line = '' + text + character;
  var newEditorState = editorState;
  var matchArr = void 0;
  do {
    matchArr = re.exec(line);
    if (matchArr) {
      newEditorState = (0, _insertLink2.default)(newEditorState, matchArr);
    }
  } while (matchArr);
  return newEditorState;
};

exports.default = handleLink;