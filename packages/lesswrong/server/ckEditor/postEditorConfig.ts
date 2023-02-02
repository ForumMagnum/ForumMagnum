import { isMigrations } from "../../lib/executionEnvironment";

export const getPostEditorConfig = () => {
  if (isMigrations) {
    return {};
  } else {
    const {postEditorConfig} = require('../../../../public/lesswrong-editor/src/editorConfigs');
    return postEditorConfig;
  }
}
