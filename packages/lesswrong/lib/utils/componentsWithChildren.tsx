import React, { PropsWithChildren } from 'react';
import {
  InstantSearch as BadlyTypedInstantSearch,
  Index as BadlyTypedIndex,
  Hits as BadlyTypedHits
} from 'react-instantsearch-dom';

/**
 * Starting in React 18, components must explicitly specify that they take children as props.
 * Some components in 3rd party libraries have incorrect or outdated type annotations that suggest they don't take children (when in practice they do)
 * We manually cast those
 */
export function componentWithChildren<T>(component: React.ComponentType<T>): React.ComponentType<PropsWithChildren<T>> {
  return component as React.ComponentType<PropsWithChildren<T>>;
}

export const InstantSearch = componentWithChildren(BadlyTypedInstantSearch);
export const Index = componentWithChildren(BadlyTypedIndex);
export const Hits = componentWithChildren(BadlyTypedHits);
