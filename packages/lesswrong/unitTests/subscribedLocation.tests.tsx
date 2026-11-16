/** @jest-environment jsdom */
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { LocationStoreProvider } from '../lib/locationContexts';
import { useSubscribedLocation } from '../lib/routeUtil';
import type { RouterLocation } from '../lib/routeChecks/parseRoute';

function locationFor(url: string): RouterLocation {
  const parsed = new URL(url, 'https://www.lesswrong.com');
  return {
    url,
    pathname: parsed.pathname,
    hash: parsed.hash,
    query: Object.fromEntries(parsed.searchParams),
    params: {},
    location: { pathname: parsed.pathname, search: parsed.search, hash: parsed.hash },
  };
}

const renders = jest.fn();
const LinkedComment = React.memo(function LinkedComment() {
  const commentId = useSubscribedLocation(({ query }) => query.commentId);
  renders(commentId);
  return <span>{commentId}</span>;
});

const Page = ({ url }: { url: string }) => <LocationStoreProvider location={locationFor(url)}>
  <LinkedComment/>
</LocationStoreProvider>;

describe('useSubscribedLocation', () => {
  afterEach(cleanup);

  it('rerenders a selecting component only when its selection changes', () => {
    renders.mockClear();
    const { rerender } = render(<Page url="/posts/abc/slug?commentId=c1"/>);
    expect(renders).toHaveBeenCalledTimes(1);

    // The search modal writes its query to the URL on every keystroke
    rerender(<Page url="/posts/abc/slug?commentId=c1&search.query=a"/>);
    rerender(<Page url="/posts/abc/slug?commentId=c1&search.query=al"/>);
    expect(renders).toHaveBeenCalledTimes(1);

    rerender(<Page url="/posts/abc/slug?commentId=c2&search.query=al"/>);
    expect(renders).toHaveBeenCalledTimes(2);
    expect(renders).toHaveBeenLastCalledWith('c2');
  });
});
