import { registerComponent } from '../../lib/vulcan-lib';
import React, { Component } from 'react';

interface HoverOverProps {
  delay?: number,
  children: React.ReactNode,
  hoverOverComponent: any,
}
interface HoverOverState {
  showHoverOver: boolean,
}
class HoverOver extends Component<HoverOverProps,HoverOverState> {
  hoverOverWaitTimer: any;
  
  constructor(props: HoverOverProps) {
    super(props);
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

const HoverOverComponent = registerComponent('HoverOver', HoverOver);

declare global {
  interface ComponentTypes {
    HoverOver: typeof HoverOverComponent
  }
}
