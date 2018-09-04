import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Editor, { composeDecorators } from 'draft-js-plugins-editor';
import createInlineToolbarPlugin, { Separator } from 'draft-js-inline-toolbar-plugin';
import createImagePlugin from 'draft-js-image-plugin';
import createAlignmentPlugin from 'draft-js-alignment-plugin';
import createFocusPlugin from 'draft-js-focus-plugin';
import createResizeablePlugin from 'draft-js-resizeable-plugin';
import createLinkPlugin from 'draft-js-anchor-plugin';
import createRichButtonsPlugin from 'draft-js-richbuttons-plugin';
import createBlockBreakoutPlugin from 'draft-js-block-breakout-plugin'
import createDividerPlugin from './editor-plugins/divider';
import createSidenotePlugin from './editor-plugins/sidenote-plugin';
import createMathjaxPlugin from 'draft-js-mathjax-plugin'
import createMarkdownShortcutsPlugin from './editor-plugins/markdown-shortcuts-plugin';
import { withTheme } from '@material-ui/core/styles';
import { myKeyBindingFn } from './editor-plugins/keyBindings.js'
import ImageButton from './editor-plugins/image/ImageButton.jsx';
import {
  createBlockStyleButton,
  ItalicButton,
  BoldButton,
  UnderlineButton,
  BlockquoteButton,
} from 'draft-js-buttons';

const HeadlineOneButton = createBlockStyleButton({
  blockType: 'header-one',
  children: (
    <svg fill="#000000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 4v3h5.5v12h3V7H19V4z"/>
      <path d="M0 0h24v24H0V0z" fill="none"/>
    </svg>),
});

const HeadlineTwoButton = createBlockStyleButton({
  blockType: 'header-two',
  children: (
    <svg fill="#000000" height="24" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 4v3h5.5v12h3V7H19V4z"/>
      <path d="M0 0h24v24H0V0z" fill="none"/>
    </svg>),
});

const styleMap = theme => ({
  'CODE': theme.typography.code
})

class EditorForm extends Component {
  constructor(props) {
    super(props);
    this.plugins = this.initializePlugins(props.isClient);
  }

  initializePlugins = (isClient) => {
    const linkPlugin = createLinkPlugin();
    const alignmentPlugin = createAlignmentPlugin();
    const focusPlugin = createFocusPlugin();
    const resizeablePlugin = createResizeablePlugin();
    const sidenotePlugin = createSidenotePlugin();
    const decorator = composeDecorators(
      resizeablePlugin.decorator,
      alignmentPlugin.decorator,
      focusPlugin.decorator
    );

    const dividerPlugin = createDividerPlugin({decorator});

    const inlineToolbarPlugin = createInlineToolbarPlugin({
      structure: [
        BoldButton,
        ItalicButton,
        UnderlineButton,
        linkPlugin.LinkButton,
        sidenotePlugin.SidenoteButton,
        Separator,
        HeadlineOneButton,
        HeadlineTwoButton,
        BlockquoteButton,
        dividerPlugin.DividerButton,
        ImageButton,
      ]
    });

    const richButtonsPlugin = createRichButtonsPlugin();
    const blockBreakoutPlugin = createBlockBreakoutPlugin()
    const markdownShortcutsPlugin = createMarkdownShortcutsPlugin();

    const imagePlugin = createImagePlugin({ decorator });
    const plugins = [
      inlineToolbarPlugin,
      alignmentPlugin,
      focusPlugin,
      resizeablePlugin,
      imagePlugin,
      linkPlugin,
      richButtonsPlugin,
      blockBreakoutPlugin,
      markdownShortcutsPlugin,
      dividerPlugin,
      sidenotePlugin
    ];

    if (isClient) {
      const mathjaxPlugin = createMathjaxPlugin({completion: 'manual'})
      plugins.push(mathjaxPlugin);
    }

    return plugins;
  }

  focus = () => {
    this._ref && this._ref.focus();
  }

  render() {
    const { theme, editorState, onChange } = this.props

    const InlineToolbar = this.plugins[0].InlineToolbar;
    const AlignmentTool = this.plugins[1].AlignmentTool;
    const className = classNames({
      "content-editor-is-empty": !editorState.getCurrentContent().hasText()
    });

    return (
      <div>
        <div className={className} onClick={this.focus}>
          <Editor
            editorState={editorState}
            onChange={onChange}
            spellCheck
            plugins={this.plugins}
            keyBindingFn={myKeyBindingFn}
            customStyleMap={styleMap(theme)}
            ref={(ref) => { this._ref = ref }}
          />
        </div>
        <InlineToolbar />
        <AlignmentTool />
      </div>
    )
  }
}

EditorForm.propTypes = {
  isClient: PropTypes.bool,
  editorState: PropTypes.object,
  onChange: PropTypes.func
}

export default withTheme()(EditorForm);
