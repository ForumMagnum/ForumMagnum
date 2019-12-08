import React, { Component } from 'react';

const withHover = (WrappedComponent) => {
  return class HoverableComponent extends Component {
    state = { hover: false, anchorEl: null }

    handleMouseOver = (event) => {
      this.setState({ hover: true, anchorEl: event.currentTarget})
    }

    handleMouseLeave = () => {
      this.setState({ hover: false, anchorEl: null })
    }

    render () {
      const props = { hover: this.state.hover, anchorEl: this.state.anchorEl, ...this.props, stopHover: this.handleMouseLeave }
      return (
        <span onMouseOver={this.handleMouseOver} onMouseLeave={this.handleMouseLeave}>
          <WrappedComponent { ...props } />
        </span>
      )
    }
  }
}

export default withHover
