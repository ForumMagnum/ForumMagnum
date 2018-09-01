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
    const selection = editorState.getSelection();
    const entity = EditorUtils.getCurrentEntity(editorState);
    const key = EditorUtils.getCurrentEntityKey(editorState);

    // TODO: remove entity
    console.log('Remove entity', key, entity, selection)
  }

  addSidenoteAtSelection = () => {
    const editorState = this.props.getEditorState();
    const selection = editorState.getSelection();
    const contentState = editorState.getCurrentContent();
    const entity = contentState.createEntity(
      'SIDENOTE',
      'MUTABLE',
      {}
    );

    const nextContentState = Modifier.applyEntity(
      entity,
      selection,
      contentState.getLastCreatedEntityKey()
    );

    const nextState = EditorState.push(
      editorState,
      nextContentState,
      'apply-entity'
    )

    console.log('nextState', nextState);

    this.props.setEditorState(nextState)
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
