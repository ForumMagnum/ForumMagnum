import React from 'react';

/**
 * Given a hook function, return a higher-order component which calls it and
 * adds the result as extra props. If componentPropsToHookParams is given, calls
 * it on the component's props and passes the result as an argument to hookFn;
 * otherwise hookFn is assumed to take no arguments.
 *
 * Components may or may not accept a ref. If they are, we need to forward the
 * ref to the underlying component, so we use forwardRef here.
 */
export function hookToHoc<P, HP, HR>(
  hookFn: (hookParams?: HP) => HR,
  componentPropsToHookParams?: (props: React.PropsWithoutRef<P>) => HP
) {
  return (Component: React.ComponentType<P & HR>) => {
    const WithHook = React.forwardRef<any, P>((props, ref) => {
      const hookParams = componentPropsToHookParams ? componentPropsToHookParams(props) : undefined;
      const hookProps = hookParams !== undefined ? hookFn(hookParams) : hookFn();
      return <Component ref={ref} {...(props as P)} {...hookProps} />;
    });
    return WithHook;
  }
}
