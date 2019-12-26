import React, { Component } from 'react';
import { hookToHoc } from '../../lib/hocUtils.js';
import { withTracking } from '../../lib/analyticsEvents'

export const HoverOpenContext = React.createContext('hoverOpen')

const HoverManagerComponent = (WrappedComponent) => {
  return class HoverableComponent extends Component {
    state = { hover: false, anchorEl: null }

    handleMouseOver = (event) => {
      this.setState({ hover: true, anchorEl: event.currentTarget})
      this.captureEvent("hoverEventTriggered")
    }

    handleMouseLeave = () => {
      this.setState({ hover: false, anchorEl: null })
    }

    render () {
      const props = { hover: this.state.hover, anchorEl: this.state.anchorEl, ...this.props, stopHover: this.handleMouseLeave }
      return (
          <HoverOpenContext.Provider value={
            <span onMouseOver={this.handleMouseOver} onMouseLeave={this.handleMouseLeave}>
            <WrappedComponent {...props} />
            </span>
          }/>
      )
    }
  }
}

export const HoverManager = withTracking(HoverManagerComponent)
export const useHover = () => React.useContext(HoverOpenContext)
export const withHover = hookToHoc(useHover)
export default withHover
