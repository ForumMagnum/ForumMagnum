import React, {Component, useState, useEffect} from 'react';
import {registerComponent} from '../../lib/vulcan-lib';
import {withSubscribedLocation} from '../../lib/routeUtil';

// Scroll restoration based on https://reacttraining.com/react-router/web/guides/scroll-restoration.
export default class ScrollToTop extends Component<any> {
  componentDidUpdate(prevProps) {
    if (this.props.location.pathname !== prevProps.location.pathname) {
      window.scrollTo(0, 0);
    }
  }
  
  render() {
    return null;
  }
}

const ScrollToTopComponent = registerComponent('ScrollToTop', ScrollToTop, {
  hocs: [withSubscribedLocation]
});

declare global {
  interface ComponentTypes {
    ScrollToTop: typeof ScrollToTopComponent
  }
}
