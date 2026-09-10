/** @jest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
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
