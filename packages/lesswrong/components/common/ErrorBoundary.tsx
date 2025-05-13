import React, { ErrorInfo } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { configureScope, captureException }from '@sentry/core';
import ErrorMessage from "./ErrorMessage";

interface ErrorBoundaryProps {
  children: React.ReactNode,
}

interface ErrorBoundaryState {
  error: string | false,

  /**
   * The current page URL when the error occurred. Used to clear errors in
   * components that persist across page navigation on the client.
   */
  errorLocation?: string,
}

class ErrorBoundaryInner extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: false };
  }

  static getDerivedStateFromProps(
    props: ErrorBoundaryProps,
    state: ErrorBoundaryState,
  ) {
    if (!bundleIsServer && state.error && state.errorLocation !== window.location.href) {
      return {error: false};
    }
    return null;
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({
      error: error.toString(),
      errorLocation: bundleIsServer ? "" : window.location.href,
    });
    configureScope(scope => {
      Object.keys(info).forEach((key: keyof ErrorInfo) => {
        scope.setExtra(key, info[key]);
      });
    });
    captureException(error);
  }

  render() {
    if (this.state.error) {
      return <ErrorMessage message={this.state.error}/>
    }
    if (this.props.children)
      return this.props.children;
    else
      return null;
  }
}

export default registerComponent("ErrorBoundary", ErrorBoundaryInner);


