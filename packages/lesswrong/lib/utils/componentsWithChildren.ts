import React, { PropsWithChildren } from 'react';

import { default as BadlyTypedNoSSR } from 'react-no-ssr';
import { default as BadlyTypedHelmet } from 'react-helmet';
import { InstantSearch as BadlyTypedInstantSearch, Index as BadlyTypedIndex } from 'react-instantsearch-dom';

/**
 * Starting in React 18, components must explicitly specify that they take children as props.
 * Some components in 3rd party libraries have incorrect or outdated type annotations that suggest they don't take children (when in practice they do)
 * We manually cast those
 */
export function componentWithChildren<T>(component: React.ComponentType<T>): React.ComponentType<PropsWithChildren<T>> {
  return component as React.ComponentType<PropsWithChildren<T>>;
}

export const NoSSR = componentWithChildren(BadlyTypedNoSSR);
export const Helmet = componentWithChildren(BadlyTypedHelmet);
export const InstantSearch = componentWithChildren(BadlyTypedInstantSearch);
export const Index = componentWithChildren(BadlyTypedIndex);
