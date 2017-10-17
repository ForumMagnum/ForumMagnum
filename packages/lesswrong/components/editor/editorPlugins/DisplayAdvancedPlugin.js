import React, { Component } from 'react'
import IconButton from 'material-ui/IconButton'
import PaletteIcon from 'material-ui/svg-icons/image/palette'

import { ToolbarButton } from './ToolbarButton'
import { connect } from 'react-redux';

import Plugin from './plugin'
class DisplayAdvancedPlugin extends Plugin {
  constructor(props) {
    super(props)
    this.onClick = props.onClick
    this.isActive = props.isActive
  }
  name = "DisplayAdvanced"

  createButton = (icon) => ({ editorState, onChange }: Props) => {
    const onClick = e => {
      e.preventDefault()
      this.onClick()
    }

    return <ToolbarButton
              onClick={onClick}
              isActive={this.props.showAdvancedEditor}
              icon={icon} />
  }

  toolbarButtons = [
    this.createButton(<PaletteIcon />)
  ]
}


const mapStateToProps = state => ({ showAdvancedEditor: state.showAdvancedEditor });

export default connect(mapStateToProps)(DisplayAdvancedPlugin);
