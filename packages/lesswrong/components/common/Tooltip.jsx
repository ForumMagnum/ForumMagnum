import { Components, registerComponent } from 'meteor/vulcan:core';
import React, { Component } from 'react';

class Tooltip extends Component {

  constructor() {
    super();
    this.state = {
      showTooltip: false,
    };
    this.tooltipWaitTimer = undefined
  }

  showTooltip = () => {
    this.setState({showTooltip:true})
  }

  hideTooltip = () => {
    this.setState({showTooltip:false})
  }

  handleHoverOver = () => {
    this.tooltipWaitTimer = setTimeout(this.showTooltip, this.props.delay || 250)
  }

  handleHoverExit = () => {
    this.hideTooltip()
    clearTimeout(this.tooltipWaitTimer)
  }

  render () {
    const { children, tooltip } = this.props

    return (
      <span className="lw-tooltip-wrapper"
        onMouseEnter={this.handleHoverOver}
        onMouseLeave={this.handleHoverExit}
      >
        { children }
        { this.state.showTooltip &&
          <div className="lw-tooltip">
              { tooltip }
          </div>
        }
      </span>
    )
  }
}

registerComponent('Tooltip', Tooltip);
