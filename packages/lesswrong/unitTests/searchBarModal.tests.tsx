/** @jest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import SearchBar from '../components/common/SearchBar';

jest.mock('@/components/hooks/useStyles', () => ({useStyles: () => ({})}));
jest.mock('@/components/hooks/defineStyles', () => ({defineStyles: () => ({})}));
jest.mock('../lib/vulcan-lib/components', () => ({registerComponent: (_name: string, component: unknown) => component}));
jest.mock('../components/common/withErrorBoundary', () => ({__esModule: true, default: (component: unknown) => component}));
jest.mock('../components/common/ForumIcon', () => ({__esModule: true, default: () => null}));
jest.mock('../components/hooks/useOnNavigate', () => ({useOnNavigate: () => {}}));
jest.mock('../lib/search/searchUtil', () => ({isSearchEnabled: () => true}));
jest.mock('@/lib/vendor/@material-ui/core/src/IconButton', () => ({
  __esModule: true,
  default: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props} />,
}));
jest.mock('../components/search/SearchModal', () => ({
  __esModule: true,
  default: ({onClose}: {onClose: () => void}) => <div role="dialog"><button onClick={onClose}>Close search</button></div>,
}));

afterEach(() => jest.restoreAllMocks());

it.each([
  ['Mac', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'Cmd'],
  ['Windows', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Ctrl'],
  ['Linux', 'Mozilla/5.0 (X11; Linux x86_64)', 'Ctrl'],
  ['iPhone', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)', 'Cmd'],
  ['iPad', 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)', 'Cmd'],
  ['Android', 'Mozilla/5.0 (Linux; Android 15)', 'Ctrl'],
  ['unknown platform', '', 'Ctrl'],
])('shows the shortcut for %s and opens search with it', (_platform, userAgent, modifier) => {
  jest.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(userAgent);
  render(<SearchBar onSetIsActive={jest.fn()} />);
  const button = screen.getByRole('button', {name: 'Search'});
  expect(button.querySelector('kbd')?.textContent).toBe(`${modifier}+K`);
  fireEvent.keyDown(document, {key: 'k', metaKey: modifier === 'Cmd', ctrlKey: modifier === 'Ctrl'});
  expect(screen.getByRole('dialog')).toBeTruthy();
});

it('hydrates cached server markup on a Mac without a mismatch', () => {
  const userAgent = jest.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue('');
  const markup = renderToString(<SearchBar onSetIsActive={jest.fn()} />);
  expect(userAgent).not.toHaveBeenCalled();
  userAgent.mockReturnValue('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');
  const container = document.createElement('div');
  container.innerHTML = markup;
  document.body.append(container);
  const onRecoverableError = jest.fn();
  render(<SearchBar onSetIsActive={jest.fn()} />, {container, hydrate: true, onRecoverableError});
  expect(container.querySelector('kbd')?.textContent).toBe('Cmd+K');
  expect(onRecoverableError).not.toHaveBeenCalled();
});

it('opens the same modal from the icon, Cmd+K, and Ctrl+K', () => {
  render(<SearchBar onSetIsActive={jest.fn()} />);
  fireEvent.click(screen.getByRole('button', {name: 'Search'}));
  expect(screen.getByRole('dialog')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', {name: 'Close search'}));
  expect(screen.queryByRole('dialog')).toBeNull();
  fireEvent.keyDown(document, {key: 'k', metaKey: true});
  expect(screen.getByRole('dialog')).toBeTruthy();
  fireEvent.keyDown(document, {key: 'k', metaKey: true});
  expect(screen.queryByRole('dialog')).toBeNull();
  fireEvent.keyDown(document, {key: 'k', ctrlKey: true});
  expect(screen.getByRole('dialog')).toBeTruthy();
});

it('leaves the editor link shortcut alone', () => {
  render(<SearchBar onSetIsActive={jest.fn()} />);
  const editor = document.createElement('div');
  Object.defineProperty(editor, 'isContentEditable', {value: true});
  document.body.append(editor);
  fireEvent.keyDown(editor, {key: 'k', metaKey: true});
  expect(screen.queryByRole('dialog')).toBeNull();
  editor.remove();
});
