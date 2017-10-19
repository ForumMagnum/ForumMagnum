import React, { Component } from 'react'
import { ToolbarButton } from '../ToolbarButton'

export default class ToggleAdvancedEditorButton extends Component {
  constructor(props) {
    super(props)
    this.state = {
      active: false,
    };
  }

  handleClick = (e) => {
    e.preventDefault()
    this.props.onClick()
    this.setState({active: !this.state.active})
  }

  render() {
    return <ToolbarButton
              onClick={this.handleClick}
              isActive={this.state.active}
              icon={this.props.icon} />
  }
}
