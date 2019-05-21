import { registerComponent } from 'meteor/vulcan:core';
import React, { Component } from 'react';

class HoverOver extends Component {

  constructor() {
    super();
    this.state = {
      showHoverOver: false,
    };
    this.hoverOverWaitTimer = undefined
  }

  showHoverOver = () => {
    this.setState({showHoverOver:true})
  }

  hideHoverOver = () => {
    this.setState({showHoverOver:false})
  }

  handleMouseEnter = () => {
    this.hoverOverWaitTimer = setTimeout(this.showHoverOver, this.props.delay || 100)
  }

  handleMouseExit = () => {
    this.hideHoverOver()
    clearTimeout(this.hoverOverWaitTimer)
  }

  render () {
    const { children, hoverOverComponent } = this.props

    return (
      <span onMouseEnter={this.handleMouseEnter} onMouseLeave={this.handleMouseExit}>
        { children }
        { this.state.showHoverOver && <div>{ hoverOverComponent }</div>}
      </span>
    )
  }
}

registerComponent('HoverOver', HoverOver);
