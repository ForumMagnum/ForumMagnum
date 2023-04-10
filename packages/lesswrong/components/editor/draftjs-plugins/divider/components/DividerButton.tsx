import React, { Component } from 'react';
import unionClassNames from 'union-class-names';

import {
  EditorState,
  // EditorState,
  // Modifier,
  // AtomicBlockUtils,
  RichUtils,
} from 'draft-js';

import {
  // addNewBlock,
  getCurrentBlock,
  isFirstBlock,
  isLastBlock,
} from '../utils';
import {
  // insertNewLineBefore,
  insertNewLineAfter,
  insertNewLineBoth,
} from '../utils/insertNewLine';

export interface DividerButtonProps {
  getEditorState: () => EditorState;
  setEditorState: (state: EditorState) => any;
  blockType: string,
  theme: any
}

export default class DividerButton extends Component<DividerButtonProps> {
  constructor(props: DividerButtonProps) {
    super(props);
  }

  addDivider = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    const editorState = this.props.getEditorState();
    // const contentState = editorState.getCurrentContent();
    // const selectionState = contentState.getSelectionAfter();
    const isFirst = isFirstBlock(editorState);
    const isLast = isLastBlock(editorState);
    const isBoth = isFirst && isLast;
    const newDividerBlock = RichUtils.toggleBlockType(
      editorState,
      this.props.blockType,
    );
    let newEditorState;

    if (isLast) {
      newEditorState = insertNewLineAfter(
        editorState,
        getCurrentBlock(newDividerBlock),
      );
    } else if (isBoth || isFirst) {
      newEditorState = insertNewLineBoth(
        editorState,
        getCurrentBlock(newDividerBlock),
      );
    } else {
      newEditorState = newDividerBlock;
    }

    this.props.setEditorState(newEditorState);
  };

  preventBubblingUp = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  blockTypeIsActive = () => {
    // if the button is rendered before the editor
    if (!this.props.getEditorState) {
      return false;
    }

    const editorState = this.props.getEditorState();
    const type = editorState
      .getCurrentContent()
      .getBlockForKey(editorState.getSelection().getStartKey())
      .getType();
    return type === this.props.blockType;
  };

  render() {
    const { theme } = this.props;
    const className = this.blockTypeIsActive()
      ? unionClassNames(theme.button, theme.active)
      : theme.button;

    return (
      <div className={theme.buttonWrapper} onMouseDown={this.preventBubblingUp}>
        <button className={className} onClick={this.addDivider} type="button">
          {/* <svg
            height="24"
            viewBox="0 0 24 24"
            width="24"
            xmlns="http://www.w3.org/2000/svg"
            >
            <path d="M0 0h24v24H0z" fill="none" />
            <path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
          </svg> */}
          <svg width="24" height="24" viewBox="0 0 24 24">
            <g fillRule="evenodd">
              <path d="M8.45 12H5.3c-.247 0-.45.224-.45.5 0 .274.203.5.45.5h5.4c.247 0 .45-.226.45-.5 0-.276-.203-.5-.45-.5H8.45z"/>
              <path d="M17.45 12H14.3c-.247 0-.45.224-.45.5 0 .274.203.5.45.5h5.4c.248 0 .45-.226.45-.5 0-.276-.202-.5-.45-.5h-2.25z"/>
            </g>
          </svg>
        </button>
      </div>
    );
  }
}
