import insertImage from './insertImage';

const handleImage = (editorState, character) => {
  const re = /!\[([^\]]*)]\(([^)"]+)(?: "([^"]+)")?\)/g;
  const key = editorState.getSelection().getStartKey();
  const text = editorState.getCurrentContent().getBlockForKey(key).getText();
  const line = `${text}${character}`;
  let newEditorState = editorState;
  let matchArr;
  do {
    matchArr = re.exec(line);
    if (matchArr) {
      newEditorState = insertImage(newEditorState, matchArr);
    }
  } while (matchArr);
  return newEditorState;
};

export default handleImage;
