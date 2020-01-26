import React from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import * as Sentry from '@sentry/browser';

interface ErrorBoundaryProps {
  children: any,
}
interface ErrorBoundaryState {
  error: any,
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps,ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: false };
  }

  componentDidCatch(error, info) {
    this.setState({ error: error.toString() });
    Sentry.configureScope(scope => {
      Object.keys(info).forEach(key => {
        scope.setExtra(key, info[key]);
      });
    });
    Sentry.captureException(error);
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

const ErrorBoundaryComponent = registerComponent("ErrorBoundary", ErrorBoundary);

declare global {
  interface ComponentTypes {
    ErrorBoundary: typeof ErrorBoundaryComponent
  }
}
