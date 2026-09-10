/** @jest-environment jsdom */
import React from 'react';
import { createPortal } from 'react-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import SearchModal from '../components/search/SearchModal';

jest.mock('@/components/hooks/useStyles', () => ({useStyles: () => ({})}));
jest.mock('@/components/hooks/defineStyles', () => ({defineStyles: () => ({})}));
jest.mock('../components/search/SearchPage', () => {
  const FakeSearchPage = ({presentation, onClose, timeframeSlot}: {presentation: string, onClose: () => void, timeframeSlot?: HTMLElement | null}) => {
    const [timeframeOpen, setTimeframeOpen] = React.useState(false);
    return <>
      <input aria-label="Search" data-presentation={presentation} />
      <button onClick={() => setTimeframeOpen(true)}>Timeframe</button>
      <button onClick={onClose}>Close search</button>
      {timeframeOpen && timeframeSlot && createPortal(<section aria-label="Timeframe"><button>Done with timeframe</button></section>, timeframeSlot)}
    </>;
  };
  return {__esModule: true, default: FakeSearchPage};
});

it('focuses the shared search, traps Tab, locks scrolling, and restores focus on close', () => {
  const trigger = document.createElement('button');
  document.body.append(trigger);
  trigger.focus();
  const {unmount} = render(<SearchModal onClose={jest.fn()} />);
  const input = screen.getByRole('textbox', {name: 'Search'});
  expect(input.getAttribute('data-presentation')).toBe('modal');
  expect(document.activeElement).toBe(input);
  expect(document.body.style.overflow).toBe('hidden');
  fireEvent.keyDown(input, {key: 'Tab', shiftKey: true});
  expect(document.activeElement).toBe(screen.getByRole('button', {name: 'Close search'}));
  fireEvent.keyDown(document.activeElement!, {key: 'Tab'});
  expect(document.activeElement).toBe(input);
  unmount();
  expect(document.body.style.overflow).toBe('');
  expect(document.activeElement).toBe(trigger);
  trigger.remove();
});

it('dismisses on Escape and backdrop clicks but not clicks inside search', () => {
  const onClose = jest.fn();
  render(<SearchModal onClose={onClose} />);
  fireEvent.click(screen.getByRole('textbox'));
  expect(onClose).not.toHaveBeenCalled();
  fireEvent.keyDown(screen.getByRole('textbox'), {key: 'Escape'});
  expect(onClose).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('dialog').parentElement!);
  expect(onClose).toHaveBeenCalledTimes(2);
});

it('skips controls in collapsed filter panels when wrapping focus', () => {
  render(<SearchModal onClose={jest.fn()} />);
  const collapsed = document.createElement('div');
  collapsed.style.display = 'none';
  collapsed.append(document.createElement('button'));
  screen.getByRole('dialog').prepend(collapsed);
  const close = screen.getByRole('button', {name: 'Close search'});
  close.focus();
  fireEvent.keyDown(close, {key: 'Tab'});
  expect(document.activeElement).toBe(screen.getByRole('textbox', {name: 'Search'}));
});

it('layers the timeframe over the dialog box and keeps it inside the focus trap', () => {
  const onClose = jest.fn();
  render(<SearchModal onClose={onClose} />);
  fireEvent.click(screen.getByRole('button', {name: 'Timeframe'}));
  const dialog = screen.getByRole('dialog');
  const region = screen.getByRole('region', {name: 'Timeframe'});
  const input = screen.getByRole('textbox', {name: 'Search'});
  expect(dialog.contains(region)).toBe(true);
  expect(input.parentElement!.contains(region)).toBe(false);
  expect(region.compareDocumentPosition(input) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  const close = screen.getByRole('button', {name: 'Close search'});
  close.focus();
  fireEvent.keyDown(close, {key: 'Tab'});
  expect(document.activeElement).toBe(screen.getByRole('button', {name: 'Done with timeframe'}));
  fireEvent.click(region);
  expect(onClose).not.toHaveBeenCalled();
});
