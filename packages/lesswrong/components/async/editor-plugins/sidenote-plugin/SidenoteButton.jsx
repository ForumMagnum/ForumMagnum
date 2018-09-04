import React, { Component } from 'react';
import { Modifier, EditorState } from 'draft-js';
import EditorUtils from 'draft-js-plugins-utils';
import classNames from 'classnames';

class SidenoteButton extends Component {

  preventBubblingUp = (event) => { event.preventDefault(); }

  isSidenoteEntityActive = () => {
    return EditorUtils.hasEntity(this.props.getEditorState(), 'SIDENOTE');
  }

  removeSidenoteAtSelection = () => {
    const editorState = this.props.getEditorState();

    const nextContentState = Modifier.applyEntity(
      editorState.getCurrentContent(),
      editorState.getSelection(),
      null // Using a 'null' entity key deletes all entites in the selection
    );

    this.props.setEditorState(
      EditorState.push(
        editorState,
        nextContentState,
        'apply-entity'
      )
    );
  }

  addSidenoteAtSelection = () => {
    const editorState = this.props.getEditorState();
    const contentState = editorState.getCurrentContent();

    const contentStateWithEntity = contentState.createEntity(
      'SIDENOTE',
      'MUTABLE',
      {}
    );

    const nextContentState = Modifier.applyEntity(
      contentStateWithEntity,
      editorState.getSelection(),
      contentState.getLastCreatedEntityKey()
    );

    this.props.setEditorState(
      EditorState.push(
        editorState,
        nextContentState,
        'apply-entity'
      )
    );
  }

  toggleSidenote = () => {
    event.preventDefault();
    event.stopPropagation();

    if (this.isSidenoteEntityActive()) {
      this.removeSidenoteAtSelection();
    } else {
      this.addSidenoteAtSelection();
    }
  }

  render() {
    const { theme, children } = this.props;
    const className = classNames(theme.button, {
      [theme.active]: this.isSidenoteEntityActive()
    });

    return (
      <div
        className={theme.buttonWrapper}
        onMouseDown={this.preventBubblingUp}
      >
        <button
          className={className}
          onClick={this.toggleSidenote}
          type="button"
          children={children}
        />
      </div>
    );
  }
}

export default SidenoteButton;
