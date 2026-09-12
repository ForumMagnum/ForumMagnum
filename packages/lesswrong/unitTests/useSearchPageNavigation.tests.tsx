/** @jest-environment jsdom */
import React, { useRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { useSearchPageNavigation } from '../components/search/useSearchPageNavigation';

const loadMore = jest.fn();
const openResult = jest.fn();

function SearchHarness({ids = ['a', 'b', 'c'], searchKey = 'query'}: {ids?: string[], searchKey?: string}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const onKeyDown = useSearchPageNavigation({inputRef, resultsRef, searchKey, loadMore});
  return <div onKeyDown={onKeyDown}>
    <input ref={inputRef} aria-label="Search" />
    <button>Filter</button>
    <div ref={resultsRef}>
      {ids.map(id => <div key={id} data-search-result data-testid={id}>
        <a href={`#${id}`} onClick={event => {event.preventDefault(); openResult(id);}}>{id}</a>
        <a href={`#author-${id}`}>Author {id}</a>
      </div>)}
    </div>
  </div>;
}

beforeEach(() => {
  jest.clearAllMocks();
  HTMLElement.prototype.scrollIntoView = jest.fn();
});

function expectSelected(id: string) {
  expect(screen.getByTestId(id).getAttribute('data-search-selected')).toBe('true');
  expect(document.querySelectorAll('[data-search-selected]')).toHaveLength(1);
}

it('transfers selection between mouse movement and arrow keys, then opens the selected row', () => {
  render(<SearchHarness />);
  const input = screen.getByRole('textbox');
  input.focus();
  fireEvent.keyDown(input, {key: 'ArrowDown'});
  expectSelected('b');
  const author = screen.getByRole('link', {name: 'Author c'});
  fireEvent.mouseMove(author);
  expectSelected('c');
  expect(document.activeElement).toBe(input);
  fireEvent.keyDown(input, {key: 'ArrowUp'});
  expectSelected('b');
  fireEvent.keyDown(input, {key: 'ArrowDown'});
  expectSelected('c');
  fireEvent.keyDown(input, {key: 'ArrowUp'});
  fireEvent.mouseMove(author);
  expectSelected('c');
  fireEvent.keyDown(input, {key: 'Enter'});
  expect(openResult).toHaveBeenCalledWith('c');
  expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledTimes(4);
});

it('selects tab-focused links and ignores mouse movement outside result rows', () => {
  render(<SearchHarness />);
  screen.getByRole('link', {name: 'Author b'}).focus();
  expectSelected('b');
  fireEvent.mouseMove(screen.getByRole('button'));
  expectSelected('b');
});

it('selects the first result, skips metadata links, stops at both ends, and opens with Enter', () => {
  render(<SearchHarness />);
  const input = screen.getByRole('textbox');
  expectSelected('a');
  expect(HTMLElement.prototype.scrollIntoView).not.toHaveBeenCalled();
  fireEvent.keyDown(input, {key: 'ArrowUp'});
  expectSelected('a');
  fireEvent.keyDown(input, {key: 'ArrowDown'});
  expectSelected('b');
  expect(document.activeElement).toBe(input);
  fireEvent.keyDown(input, {key: 'ArrowDown'});
  expectSelected('c');
  expect(loadMore).toHaveBeenCalledTimes(1);
  fireEvent.keyDown(input, {key: 'ArrowDown'});
  expectSelected('c');
  fireEvent.keyDown(input, {key: 'ArrowUp'});
  expectSelected('b');
  fireEvent.keyDown(input, {key: 'Enter'});
  expect(openResult).toHaveBeenCalledWith('b');
});

it('preserves selection when appending results and resets for a new search or replaced results', () => {
  const {rerender} = render(<SearchHarness />);
  fireEvent.keyDown(screen.getByRole('textbox'), {key: 'ArrowDown'});
  rerender(<SearchHarness ids={['a', 'b', 'c', 'd']} />);
  expectSelected('b');
  rerender(<SearchHarness ids={['a', 'b', 'c', 'd']} searchKey="new filters" />);
  expectSelected('a');
  rerender(<SearchHarness ids={['e', 'f']} searchKey="new filters" />);
  expectSelected('e');
});

it('ignores modifiers, IME composition, and filter controls', () => {
  render(<SearchHarness />);
  const input = screen.getByRole('textbox');
  for (const modifier of ['shiftKey', 'ctrlKey', 'metaKey', 'altKey', 'isComposing']) {
    fireEvent.keyDown(input, {key: 'ArrowDown', [modifier]: true});
    expectSelected('a');
  }
  fireEvent.keyDown(screen.getByRole('button'), {key: 'ArrowDown'});
  expectSelected('a');
  fireEvent.keyDown(input, {key: 'Enter', isComposing: true});
  expect(openResult).not.toHaveBeenCalled();
});

it('navigates from a tab-focused metadata link and returns focus to the input', () => {
  render(<SearchHarness />);
  const author = screen.getByRole('link', {name: 'Author b'});
  author.focus();
  fireEvent.keyDown(author, {key: 'ArrowDown'});
  expectSelected('c');
  expect(document.activeElement).toBe(screen.getByRole('textbox'));
});

it('handles empty results and highlights the first asynchronously loaded result', () => {
  const {rerender} = render(<SearchHarness ids={[]} />);
  const input = screen.getByRole('textbox');
  fireEvent.keyDown(input, {key: 'ArrowUp'});
  fireEvent.keyDown(input, {key: 'Enter'});
  expect(openResult).not.toHaveBeenCalled();
  expect(loadMore).not.toHaveBeenCalled();
  rerender(<SearchHarness />);
  expectSelected('a');
});
