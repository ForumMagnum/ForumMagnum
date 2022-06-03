# DraftJS MathJax Plugin

*This is a plugin for the `draft-js-plugins-editor`.*

This plugin allows you to edit math rendered by mathjax. [Give it a try!](https://efloti.github.io/draft-js-mathjax-plugin/)

It uses the traditional `$` key to insert inline math and `CTRL+M` for block one. (Type `\$` to insert the `$` character)

![demo](https://github.com/efloti/draft-js-mathjax-plugin/raw/master/demo.gif)

## Installation

```
npm install draft-js-mathjax-plugin --save
```

## Usage

```js
import React, { Component } from 'react'
import { EditorState } from 'draft-js'
import Editor from 'draft-js-plugins-editor'
import createMathjaxPlugin from 'draft-js-mathjax-plugin'

const mathjaxPlugin = createMathjaxPlugin(/* optional configuration object */)

const plugins = [
  mathjaxPlugin,
]

export default class MyEditor extends Component {

  state = {
    editorState: EditorState.createEmpty(),
  }

  onChange = (editorState) => {
    this.setState({
      editorState,
    })
  }

  render() {
    return (
      <Editor
        editorState={this.state.editorState}
        onChange={this.onChange}
        plugins={plugins}
      />
    )
  }
}
```

Learn more [draftjs-plugins](https://github.com/draft-js-plugins/draft-js-plugins)

## Optional configuration Object

  - `macros`: an object to define mathjax macros. Example:
  
 ```js
  const mathjaxConfig = {
    macros: {
      bold: ['{\\bf #1}', 1],
    },
  }
 ```
  
  see [mathjax doc](http://docs.mathjax.org/en/latest/tex.html?highlight=macros#defining-tex-macros) to find out how to define macros.
  - `completion` (default: `'auto'`): `'none' | 'manual' | 'auto'`.
  
  If you choose `manual`, use `ctrl-<space>` to launch completion about the current tex command (if any).
  
  Use (`Shift`)`Tab` to see each possible completion in turn.
  - `script` (default: `'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.0/MathJax.js'`): 
  
  url to load mathjax from the plugin
  - `mathjaxConfig`: see [mathjax configuration object](http://docs.mathjax.org/en/latest/options/index.html). The default is:
  
  ```js
  {                                                        
    jax: ['input/TeX', 'output/CommonHTML'],                                       
    TeX: {                                                                         
      extensions: ['autoload-all.js'],                                             
    },                                                                             
    messageStyles: 'none',                                                         
    showProcessingMessages: false,                                                 
    showMathMenu: false,                                                           
    showMathMenuMSIE: false,                                                       
    preview: 'none',                                                               
    delayStartupTypeset: true,                                                     
  }
  ```

## License

MIT
