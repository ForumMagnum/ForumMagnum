/* eslint-disable import/prefer-default-export */

import React from 'react';
import classNames from 'classnames';

export function cloneElementWithClassName(child: React.ReactElement, className: string) {
  return React.cloneElement(child, {
    className: classNames((child.props as AnyBecauseHard).className, className),
  } as AnyBecauseHard);
}

export function cloneChildrenWithClassName<T>(children: React.ReactNode, className: string) {
  return React.Children.map(children, child => {
    return React.isValidElement(child) && cloneElementWithClassName(child, className);
  });
}

export function isMuiElement(element: any, muiNames: string[]) {
  return React.isValidElement(element) && muiNames.indexOf((element.type as AnyBecauseHard).muiName) !== -1;
}

/**
 * passes {value} to {ref}
 *
 * useful if you want to expose the ref of an inner component to the public api
 * while still using it inside the component
 *
 * @param ref a ref callback or ref object if anything falsy this is a no-op
 */
export function setRef<T>(
  ref: React.RefObject<T> | ((instance: T | null) => void) | null | undefined,
  value: T | null,
): void {
  if (typeof ref === 'function') {
    ref(value);
  } else if (ref) {
    ref.current = value;
  }
}
