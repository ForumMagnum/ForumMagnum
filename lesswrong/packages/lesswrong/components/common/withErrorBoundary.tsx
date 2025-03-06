import React, { forwardRef } from 'react';
import { Components } from '../../lib/vulcan-lib/components';
import ErrorBoundary from "@/components/common/ErrorBoundary";

/// Higher-order component which adds an error boundary around a component.
/// Unlike putting an <ErrorBoundary/> tag inside your render method, an error
/// boundary defined this way covers the component's constructor, the prelude
/// portions of rendering, and other miscellaneous stuff.
///
/// In order to catch errors that occur in other higher-order components on
/// the same component, put this _first_.
const withErrorBoundary = (WrappedComponent: React.FunctionComponent<unknown & { ref: React.ForwardedRef<unknown> }>) => {
  return forwardRef((props, ref) => {
    return (
      <ErrorBoundary>
        <WrappedComponent ref={ref} {...props} />
      </ErrorBoundary>
    );
  })
}

export default withErrorBoundary
