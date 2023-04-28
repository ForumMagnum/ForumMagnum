import React from 'react';

// Given a hook function, return a higher-order component which calls it and
// adds the result as extra props. If componentPropsToHookParams is given, calls
// it on the component's props and passes the result as an argument to hookFn;
// otherwise hookFn is assumed to take no arguments.
export function hookToHoc(hookFn: any, componentPropsToHookParams?: (props:Record<string,any>)=>Record<string,any>) {
  return (Component: AnyBecauseTodo) => (props: AnyBecauseTodo) => {
    const hookProps = componentPropsToHookParams ? hookFn(componentPropsToHookParams(props)) : hookFn();
    return <Component {...props} {...hookProps}/>;
  }
}
