'use strict';

const mainProjectEslintConfig = require('../.eslintrc.js');
const mainProjectRules = mainProjectEslintConfig.rules;

module.exports = {
  extends: [
    'ckeditor5',
    ...mainProjectEslintConfig.extends,
  ],
  root: true,
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "allowImportExportEverywhere": true,
    "ecmaVersion": 6,
    "sourceType": "module",
    "project": "./tsconfig.json",
  },
  "ignorePatterns": [
    "build",
    "obj",
    "tests",
    "webpack-*.config.js",
  ],
  rules: {
    ...mainProjectEslintConfig.rules,

    // We have a lot of imports that look like (eg)
    //   import Plugin from "@ckeditor/ckeditor5-core/src/plugin";
    // CkEditor5 has a default lint rule that says not to do this, the import should be:
    //   import Plugin from "@ckeditor/ckeditor5-core";
    // I'm not sure what problems (if any) are caused by importing this way, but it seems
    // not great to be doing that. So, TODO: turn that lint rule back on (below), and fix
    // all those imports.
    "ckeditor5-rules/allow-imports-only-from-main-package-entry-point": 0,
    "ckeditor5-rules/no-relative-imports": 0,

    // In the main ForumMagnum project, parens/etc are mostly not spaced. In CkEditor's
    // convention, they're always spaced. Turn off corresponding lint rules to allow both
    // styles.
    "@typescript-eslint/keyword-spacing": 0,
    "@typescript-eslint/object-curly-spacing": 0,
    "computed-property-spacing": 0,
    "space-in-parens": 0,
    "array-bracket-spacing": 0,
    "@typescript-eslint/space-infix-ops": 0,
    "@typescript-eslint/space-before-blocks": 0,
    "@typescript-eslint/space-before-function-paren": 0,
    "spaced-comment": 0,
    "lines-around-comment": 0,
    "template-curly-spacing": 0,
    "@typescript-eslint/comma-spacing": 0,

    // This rule tries to enforce that ? and : are at the end of lines, but it's better
    // for them to be at the beginning
    "operator-linebreak": 0,

    // Assorted lint rules added by the ckeditor preset that don't pass as-is. For each of
    // these, TODO: either turn it on and make it pass, or move it out of this section and
    // write an explanation of why we don't want it.
    "no-useless-return": 0,
    "@typescript-eslint/no-unused-expressions": 0,
    "@typescript-eslint/quotes": 0,
    "@typescript-eslint/semi": 0,
    "max-len": 0,
    "@typescript-eslint/explicit-member-accessibility": 0,
    "@typescript-eslint/comma-dangle": 0,
    "curly": 0,
    "arrow-parens": 0,
    "no-multiple-empty-lines": 0,
    "no-multi-spaces": 0,
    "no-trailing-spaces": 0,
    "no-unsafe-optional-chaining": 0,
    "padded-blocks": 0,
    "@typescript-eslint/array-type": 0,
    "no-useless-escape": 0,

    // Our main project uses two-space indents, while CkEditor's convention is tabs (ts=4).
    // Our plugins are currently an awkward mix of two-space indents, four-space indents, and
    // four-space tabs. Don't warn about that for now (but we'll want to clean that up and turn
    // on this warning later).
    "indent": 0,
    "no-mixed-spaces-and-tabs": 0,
  },
  plugins: [
    ...mainProjectEslintConfig.plugins,
  ],
  settings: {
    react: mainProjectEslintConfig.settings.react,
  },
};
