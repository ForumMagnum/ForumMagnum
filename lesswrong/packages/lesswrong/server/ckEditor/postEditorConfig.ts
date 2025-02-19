import { isMigrations } from "../../lib/executionEnvironment";

export const getPostEditorConfig = () => {
  if (isMigrations) {
    return {};
  } else {
    const {postEditorConfig} = require('../../../../ckEditor/src/editorConfigs');
    return postEditorConfig;
  }
}
