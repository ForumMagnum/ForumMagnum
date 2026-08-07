import React, { ErrorInfo } from 'react';
import { getSentry, captureException } from "@/lib/sentryWrapper";
import { shouldReloadAfterChunkLoadError } from "@/lib/chunkLoadErrorRecovery";
import ErrorMessage from "./ErrorMessage";

function reloadAfterChunkLoadError(error: Error) {
  if (bundleIsServer) {
    return;
  }

  try {
    if (shouldReloadAfterChunkLoadError(error, window.sessionStorage)) {
      window.location.reload();
    }
  } catch {
    // Accessing sessionStorage or reloading can fail in restricted browser
    // contexts. In that case, fall through to the normal error message.
  }
}

interface ErrorBoundaryProps {
  fallback?: React.ReactNode
  hideMessage?: boolean
  attemptChunkLoadRecovery?: boolean
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

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
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

    const Sentry = getSentry();

    const scope = Sentry?.getIsolationScope();

    Object.keys(info).forEach((key: keyof ErrorInfo) => {
      scope?.setExtra(key, info[key]);
    });

    captureException(error);
    if (this.props.attemptChunkLoadRecovery) {
      reloadAfterChunkLoadError(error);
    }
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      } else if (this.props.hideMessage) {
        return null;
      } else {
        return <ErrorMessage message={this.state.error}/>
      }
    }
    if (this.props.children)
      return this.props.children;
    else
      return null;
  }
}

export default ErrorBoundary;


