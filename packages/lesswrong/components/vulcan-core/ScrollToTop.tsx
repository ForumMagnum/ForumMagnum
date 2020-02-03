import React, {Component} from 'react';
import {withRouter} from 'react-router';
import {registerComponent} from '../../lib/vulcan-lib';

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
  hocs: [withRouter]
});

declare global {
  interface ComponentTypes {
    ScrollToTop: typeof ScrollToTopComponent
  }
}
