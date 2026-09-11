/** @jest-environment jsdom */
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import SearchResultLink from '../components/search/SearchResultLink';

jest.mock('@/components/hooks/useStyles', () => ({useStyles: () => ({}), defineStyles: () => ({})}));
jest.mock('@/components/hooks/defineStyles', () => ({defineStyles: () => ({})}));
jest.mock('@/lib/reactRouterWrapper', () => ({Link: ({to, children}: {to: string, children: React.ReactNode}) => <a href={to}>{children}</a>}));

it('exposes the result destination as a real link and copies its absolute URL without following it', async () => {
  const writeText = jest.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {configurable: true, value: {writeText}});
  render(<SearchResultLink href="/posts/example#comment" label="Example result" />);
  expect(screen.getByRole('link', {name: 'Example result'}).getAttribute('href')).toBe('/posts/example#comment');
  const button = screen.getByRole('button', {name: 'Copy link'});
  expect(button.closest('a')).toBeNull();
  await act(async () => { fireEvent.click(button); });
  expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/posts/example#comment`);
  expect(screen.getByRole('button', {name: 'Link copied'})).toBeTruthy();
});

it('reports clipboard failure without showing success and allows retrying', async () => {
  const writeText = jest.fn().mockRejectedValueOnce(new Error('Permission denied')).mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {configurable: true, value: {writeText}});
  render(<SearchResultLink href="/tag/example" label="Example tag" />);
  await act(async () => { fireEvent.click(screen.getByRole('button', {name: 'Copy link'})); });
  expect(screen.getByRole('status').textContent).toContain('Could not copy');
  expect(screen.queryByRole('button', {name: 'Link copied'})).toBeNull();
  await act(async () => { fireEvent.click(screen.getByRole('button', {name: 'Copy link'})); });
  expect(screen.getByRole('button', {name: 'Link copied'})).toBeTruthy();
});
