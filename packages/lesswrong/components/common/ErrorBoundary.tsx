import React, { ErrorInfo } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { configureScope, captureException }from '@sentry/core';
import { withLocation } from '../../lib/routeUtil';

interface ErrorBoundaryExternalProps {
  children: React.ReactNode,
}

interface ErrorBoundaryProps extends ErrorBoundaryExternalProps, WithLocationProps {}

interface ErrorBoundaryState {
  error: string | false,
  errorLocation?: string,
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: false };
  }

  static getDerivedStateFromProps(
    props: ErrorBoundaryProps,
    state: ErrorBoundaryState,
  ) {
    if (state.error && state.errorLocation !== props.location.url) {
      return {error: false};
    }
    return null;
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({
      error: error.toString(),
      errorLocation: this.props.location.url,
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
      return <Components.ErrorMessage message={this.state.error}/>
    }
    if (this.props.children)
      return this.props.children;
    else
      return null;
  }
}

const ErrorBoundaryComponent = registerComponent<ErrorBoundaryExternalProps>(
  "ErrorBoundary",
  ErrorBoundary,
  {hocs: [withLocation]},
);

declare global {
  interface ComponentTypes {
    ErrorBoundary: typeof ErrorBoundaryComponent
  }
}
