import React, { Component } from 'react';
import IconButton from 'material-ui/IconButton';
import PaletteIcon from 'material-ui/svg-icons/image/palette';

import getState from 'react-redux';

import ToggleAdvancedEditorButton from './ToggleAdvancedEditorButton'
import { connect } from 'react-redux';

import Plugin from '../plugin'

export default class DisplayAdvancedPlugin extends Plugin {
  constructor(props) {
    super(props)
    this.onClick = props.onClick
    this.isActive = true
  }
  name = "DisplayAdvanced"

  createButton = (icon) => ({ editorState, onChange }: Props) => {
    const onClick = e => {
      e.preventDefault()
      this.onClick()
    }
    return <ToggleAdvancedEditorButton
              onClick={this.onClick}
              icon={icon} />
  }

  toolbarButtons = [
    this.createButton(<PaletteIcon />)
  ]
}
