import React, { useId } from 'react';
import { renderToString } from 'react-dom/server';
import { useQuery } from '@/lib/crud/useQuery';
import { HTMLInjector } from '@/components/hooks/useInjectHTML';
import { SsrQueryCacheProvider } from '@/lib/crud/ssrQueryCache';
import { CurrentUserQuery } from '@/lib/crud/currentUserQuery';

jest.mock('next/navigation', () => ({useServerInsertedHTML: () => {}}));

const IdProbe = () => {
  const id = useId();
  return <div id={id} />;
};
const WithQuery = () => {
  useQuery(CurrentUserQuery, {skip: true});
  return <IdProbe />;
};
const WithId = () => {
  useId();
  return <IdProbe />;
};

function renderedProbeId(child: React.ReactNode): string {
  const html = renderToString(<SsrQueryCacheProvider><HTMLInjector>{child}</HTMLInjector></SsrQueryCacheProvider>);
  const match = html.match(/id="([^"]+)"/);
  if (!match) throw new Error(`No probe id in ${html}`);
  return match[1];
}

describe('useQuery on the server', () => {
  it('runs in the server bundle for this test', () => {
    expect(bundleIsServer).toBe(true);
  });

  it('materializes a tree id the way the client-side Apollo transport does', () => {
    // On the client, Apollo's streaming transport calls useId inside every
    // wrapped query hook. React folds "this component used an id" into the
    // tree ids of all descendants, so the server branch has to do the same
    // or every useId below a query-using component mismatches on hydration.
    expect(renderedProbeId(<WithQuery />)).toBe(renderedProbeId(<WithId />));
  });
});
