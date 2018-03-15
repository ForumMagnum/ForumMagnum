draft-js-markdown-shortcuts-plugin
==================================

[![CircleCI](https://circleci.com/gh/ngs/draft-js-markdown-shortcuts-plugin.svg?style=svg)](https://circleci.com/gh/ngs/draft-js-markdown-shortcuts-plugin)
[![npm](https://img.shields.io/npm/v/draft-js-markdown-shortcuts-plugin.svg)][npm]
[![Coverage Status](https://coveralls.io/repos/github/ngs/draft-js-markdown-shortcuts-plugin/badge.svg?branch=master)](https://coveralls.io/github/ngs/draft-js-markdown-shortcuts-plugin?branch=master)

A [DraftJS] plugin for supporting Markdown syntax shortcuts

This plugin works with [DraftJS Plugins] wrapper component.

![screen](screen.gif)

[View Demo][Demo]

Usage
-----

```sh
npm i --save draft-js-markdown-shortcuts-plugin
```

then import from your editor component

```js
import createMarkdownShortcutsPlugin from 'draft-js-markdown-shortcuts-plugin';
```

Example
-------

```js
import React, { Component } from 'react';
import Editor from 'draft-js-plugins-editor';
import createMarkdownShortcutsPlugin from 'draft-js-markdown-shortcuts-plugin';
import { EditorState } from 'draft-js';

const plugins = [
  createMarkdownShortcutsPlugin()
];

export default class DemoEditor extends Component {

  state = {
    editorState: EditorState.createEmpty(),
  };

  onChange = (editorState) => {
    this.setState({
      editorState,
    });
  };

  render() {
    return (
      <Editor
        editorState={this.state.editorState}
        onChange={this.onChange}
        plugins={plugins}
      />
    );
  }
}
```

License
-------

MIT. See [LICENSE]

[Demo]: https://ngs.github.io/draft-js-markdown-shortcuts-plugin
[DraftJS]: https://facebook.github.io/draft-js/
[DraftJS Plugins]: https://github.com/draft-js-plugins/draft-js-plugins
[LICENSE]: ./LICENSE
[npm]: https://www.npmjs.com/package/draft-js-markdown-shortcuts-plugin
