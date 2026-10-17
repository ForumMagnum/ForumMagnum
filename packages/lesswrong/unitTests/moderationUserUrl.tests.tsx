/** @jest-environment jsdom */

import { renderHook } from '@testing-library/react';
import * as routeUtil from '@/lib/routeUtil';
import type { NavigateTo } from '@/lib/routeUtil';
import { useModerationUserUrl } from '@/components/sunshineDashboard/supermod/useModerationUserUrl';
import type { RouterLocation } from '@/lib/routeChecks/parseRoute';

jest.mock('@/lib/routeUtil', () => ({ useNavigate: jest.fn() }));

const navigate = jest.fn<void, [NavigateTo, unknown?]>();

function location(search: string, pathname = '/admin/supermod'): RouterLocation {
  return {
    pathname,
    location: { pathname, search, hash: '#details' },
    url: `${pathname}${search}#details`,
    hash: '#details',
    params: {},
    query: Object.fromEntries(new URLSearchParams(search)),
  };
}

function getDestination(currentLocation: RouterLocation) {
  const destination = navigate.mock.calls[0][0];
  if (typeof destination !== 'function') throw new Error('Expected navigation callback');
  return destination(currentLocation);
}

beforeEach(() => {
  navigate.mockClear();
  jest.spyOn(routeUtil, 'useNavigate').mockReturnValue(navigate);
});

it('does not erase an incoming deep link when the existing queue rerenders', () => {
  const { rerender } = renderHook(() => useModerationUserUrl(null));
  window.history.replaceState(null, '', '/admin/supermod?user=dusty');
  rerender();
  expect(navigate).not.toHaveBeenCalled();
  expect(window.location.search).toBe('?user=dusty');
});

it('does not rewrite the URL when mounting with a linked user', () => {
  renderHook(() => useModerationUserUrl('dusty'));
  expect(navigate).not.toHaveBeenCalled();
});

it('updates the user parameter when opening another user and preserves other URL parts', () => {
  const { rerender } = renderHook((id: string | null) => useModerationUserUrl(id), { initialProps: 'dusty' });
  rerender('another-user');
  expect(getDestination(location('?user=dusty&other=keep'))).toEqual({
    pathname: '/admin/supermod', search: '?user=another-user&other=keep', hash: '#details',
  });
  expect(navigate.mock.calls[0][1]).toEqual({ replace: true, skipRouter: true });
});

it('removes only the user parameter when closing the detail view', () => {
  const { rerender } = renderHook((id: string | null) => useModerationUserUrl(id), { initialProps: 'dusty' });
  rerender(null);
  expect(getDestination(location('?user=dusty&other=keep'))).toEqual({
    pathname: '/admin/supermod', search: '?other=keep', hash: '#details',
  });
});

it('does not rewrite a different page during navigation away', () => {
  const { rerender } = renderHook((id: string | null) => useModerationUserUrl(id), { initialProps: 'dusty' });
  rerender(null);
  const profile = location('?other=keep', '/users/dusty-1');
  expect(getDestination(profile)).toEqual(profile.location);
});
