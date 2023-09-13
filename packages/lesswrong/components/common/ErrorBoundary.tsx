import React, { ErrorInfo } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { configureScope } from '@sentry/core';
import { captureException } from '../../lib/utils/errorUtil';

interface ErrorBoundaryProps {
  children: React.ReactNode,
}
interface ErrorBoundaryState {
  error: any,
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps,ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: false };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ error: error.toString() });
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

const ErrorBoundaryComponent = registerComponent("ErrorBoundary", ErrorBoundary);

declare global {
  interface ComponentTypes {
    ErrorBoundary: typeof ErrorBoundaryComponent
  }
}
