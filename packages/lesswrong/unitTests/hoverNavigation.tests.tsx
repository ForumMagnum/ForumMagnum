/** @jest-environment jsdom */
import React, { Activity, StrictMode, useState } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { SubscribeLocationContext } from '../lib/locationContexts';
import { useHover } from '../components/common/withHover';
import { useOnNavigateOrHide } from '../components/hooks/useOnNavigateOrHide';
import LWTooltip from '../components/common/LWTooltip';
import { TooltipSpan } from '../components/common/FMTooltip';

const captureEvent = jest.fn();
jest.mock('../lib/analyticsEvents', () => ({
  useTracking: () => ({ captureEvent }),
}));
jest.mock('../lib/routeUtil', () => ({
  useSubscribedLocation: () => React.useContext(SubscribeLocationContext),
}));
jest.mock('../lib/utils/isMobile', () => ({ isMobile: () => false }));
jest.mock('../components/hooks/useStyles', () => ({
  defineStyles: () => ({}),
  useStyles: () => ({}),
}));
jest.mock('../components/common/LWPopper', () => ({
  __esModule: true,
  default: ({ open, children, clickable }: {
    open: boolean,
    children: React.ReactNode,
    clickable?: boolean,
  }) => open ? <div role="tooltip" data-clickable={clickable}>{children}</div> : null,
}));

function Page({ url = '/', visible = true, children }: {
  url?: string,
  visible?: boolean,
  children: React.ReactNode,
}) {
  const parsed = new URL(url, 'https://www.lesswrong.com');
  return <StrictMode>
    <SubscribeLocationContext.Provider value={{
      url,
      pathname: parsed.pathname,
      hash: parsed.hash,
      query: Object.fromEntries(parsed.searchParams),
      params: {},
      location: { pathname: parsed.pathname, search: parsed.search, hash: parsed.hash },
    }}>
      <Activity mode={visible ? 'visible' : 'hidden'}>{children}</Activity>
    </SubscribeLocationContext.Provider>
  </StrictMode>;
}

function HoverTarget({ onLeave }: { onLeave?: () => void }) {
  const { eventHandlers, hover, anchorEl, everHovered } = useHover({ onLeave });
  return <button {...eventHandlers} data-hovered={hover} data-anchored={!!anchorEl} data-ever-hovered={everHovered}>
    Hover me
  </button>;
}

function PinnedTooltip() {
  const [open, setOpen] = useState(false);
  useOnNavigateOrHide(() => setOpen(false));
  return <LWTooltip title="Pinned preview" forceOpen={open} renderWithoutHover>
    <button onClick={() => setOpen(true)}>Pin</button>
  </LWTooltip>;
}

describe('hover navigation', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    captureEvent.mockClear();
  });

  afterEach(() => {
    cleanup();
    jest.useRealTimers();
  });

  it.each(['/users/example', '/?view=all', '/#comments'])('unhovers on navigation to %s without hiding', async url => {
    const onLeave = jest.fn();
    const { rerender } = render(<Page><HoverTarget onLeave={onLeave}/></Page>);
    const target = screen.getByRole('button');
    fireEvent.mouseOver(target);
    expect(target.getAttribute('data-hovered')).toBe('true');

    rerender(<Page url={url}><HoverTarget onLeave={onLeave}/></Page>);
    expect(target.getAttribute('data-hovered')).toBe('false');
    expect(target.getAttribute('data-anchored')).toBe('false');
    expect(target.getAttribute('data-ever-hovered')).toBe('true');
    expect(onLeave).toHaveBeenCalledTimes(1);
    await act(() => jest.advanceTimersByTime(3000));
    expect(captureEvent).not.toHaveBeenCalled();

    fireEvent.mouseLeave(target);
    expect(onLeave).toHaveBeenCalledTimes(1);
    expect(captureEvent).not.toHaveBeenCalled();
    fireEvent.mouseOver(target);
    expect(target.getAttribute('data-hovered')).toBe('true');
  });

  it('cleans up the latest leave callback and timer when Activity hides, and stays closed on restoration', async () => {
    const oldOnLeave = jest.fn();
    const onLeave = jest.fn();
    const { rerender } = render(<Page><HoverTarget onLeave={oldOnLeave}/></Page>);
    fireEvent.mouseOver(screen.getByRole('button'));
    rerender(<Page><HoverTarget onLeave={onLeave}/></Page>);
    expect(screen.getByRole('button').getAttribute('data-hovered')).toBe('true');
    expect(oldOnLeave).not.toHaveBeenCalled();
    expect(onLeave).not.toHaveBeenCalled();

    rerender(<Page visible={false}><HoverTarget onLeave={onLeave}/></Page>);
    expect(onLeave).toHaveBeenCalledTimes(1);
    await act(() => jest.advanceTimersByTime(1000));
    expect(captureEvent).not.toHaveBeenCalled();
    rerender(<Page><HoverTarget onLeave={onLeave}/></Page>);
    const target = screen.getByRole('button');
    expect(target.getAttribute('data-hovered')).toBe('false');
    expect(target.getAttribute('data-anchored')).toBe('false');
    expect(onLeave).toHaveBeenCalledTimes(1);
    fireEvent.mouseOver(target);
    expect(target.getAttribute('data-hovered')).toBe('true');
  });

  it.each([LWTooltip, TooltipSpan])('closes %p across a cached forward/back navigation', async Tooltip => {
    const content = <Tooltip title="User preview" clickable><button>User</button></Tooltip>;
    const { rerender } = render(<Page>{content}</Page>);
    fireEvent.mouseOver(screen.getByRole('button'));
    await act(() => jest.advanceTimersByTime(200));
    expect(screen.getByRole('tooltip').getAttribute('data-clickable')).toBe('true');

    rerender(<Page url="/users/example" visible={false}>{content}</Page>);
    await act(() => jest.advanceTimersByTime(1000));
    rerender(<Page>{content}</Page>);
    expect(screen.queryByRole('tooltip')).toBeNull();

    fireEvent.mouseOver(screen.getByRole('button'));
    expect(screen.getByRole('tooltip').getAttribute('data-clickable')).toBe('false');
    await act(() => jest.advanceTimersByTime(200));
    expect(screen.getByRole('tooltip').getAttribute('data-clickable')).toBe('true');
  });

  it('resets pinned-open state on navigation and Activity restoration', () => {
    const { rerender } = render(<Page><PinnedTooltip/></Page>);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('tooltip')).toBeTruthy();
    rerender(<Page url="/#comments"><PinnedTooltip/></Page>);
    expect(screen.queryByRole('tooltip')).toBeNull();

    fireEvent.click(screen.getByRole('button'));
    rerender(<Page url="/#comments" visible={false}><PinnedTooltip/></Page>);
    rerender(<Page url="/#comments"><PinnedTooltip/></Page>);
    expect(screen.queryByRole('tooltip')).toBeNull();
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('tooltip')).toBeTruthy();
  });
});
