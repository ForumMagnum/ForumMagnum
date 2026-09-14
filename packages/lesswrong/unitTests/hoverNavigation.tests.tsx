/** @jest-environment jsdom */
import React, { Activity, StrictMode, useState } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { SubscribeLocationContext } from '../lib/locationContexts';
import { useHover, HoverTouchBehavior } from '../components/common/withHover';
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

function HoverTarget({ onLeave, touch, onClick }: {
  onLeave?: () => void,
  touch?: HoverTouchBehavior,
  onClick?: () => void,
}) {
  const { eventHandlers, hover, anchorEl, everHovered } = useHover({ onLeave, touch });
  return <button {...eventHandlers} onClick={onClick} data-hovered={hover} data-anchored={!!anchorEl} data-ever-hovered={everHovered}>
    Hover me
  </button>;
}

// jsdom has no PointerEvent, so fireEvent.pointerOver etc. would dispatch a
// plain Event with no pointerType. Provide the minimum needed to distinguish
// touch from mouse.
class TestPointerEvent extends MouseEvent {
  pointerType: string;
  constructor(type: string, init: MouseEventInit & { pointerType?: string } = {}) {
    super(type, init);
    this.pointerType = init.pointerType ?? "mouse";
  }
}

function tap(el: Element) {
  fireEvent.pointerDown(el, { pointerType: "touch" });
  fireEvent.pointerOver(el, { pointerType: "touch" });
  fireEvent.pointerLeave(el, { pointerType: "touch" });
  fireEvent.click(el);
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
    Object.assign(window, { PointerEvent: TestPointerEvent });
  });

  afterEach(() => {
    cleanup();
    jest.useRealTimers();
  });

  it.each(['/users/example', '/?view=all', '/#comments'])('unhovers on navigation to %s without hiding', async url => {
    const onLeave = jest.fn();
    const { rerender } = render(<Page><HoverTarget onLeave={onLeave}/></Page>);
    const target = screen.getByRole('button');
    fireEvent.pointerOver(target);
    expect(target.getAttribute('data-hovered')).toBe('true');

    rerender(<Page url={url}><HoverTarget onLeave={onLeave}/></Page>);
    expect(target.getAttribute('data-hovered')).toBe('false');
    expect(target.getAttribute('data-anchored')).toBe('false');
    expect(target.getAttribute('data-ever-hovered')).toBe('true');
    expect(onLeave).toHaveBeenCalledTimes(1);
    await act(() => jest.advanceTimersByTime(3000));
    expect(captureEvent).not.toHaveBeenCalled();

    fireEvent.pointerLeave(target);
    expect(onLeave).toHaveBeenCalledTimes(1);
    expect(captureEvent).not.toHaveBeenCalled();
    fireEvent.pointerOver(target);
    expect(target.getAttribute('data-hovered')).toBe('true');
  });

  it('cleans up the latest leave callback and timer when Activity hides, and stays closed on restoration', async () => {
    const oldOnLeave = jest.fn();
    const onLeave = jest.fn();
    const { rerender } = render(<Page><HoverTarget onLeave={oldOnLeave}/></Page>);
    fireEvent.pointerOver(screen.getByRole('button'));
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
    fireEvent.pointerOver(target);
    expect(target.getAttribute('data-hovered')).toBe('true');
  });

  it.each([LWTooltip, TooltipSpan])('closes %p across a cached forward/back navigation', async Tooltip => {
    const content = <Tooltip title="User preview" clickable><button>User</button></Tooltip>;
    const { rerender } = render(<Page>{content}</Page>);
    fireEvent.pointerOver(screen.getByRole('button'));
    await act(() => jest.advanceTimersByTime(200));
    expect(screen.getByRole('tooltip').getAttribute('data-clickable')).toBe('true');

    rerender(<Page url="/users/example" visible={false}>{content}</Page>);
    await act(() => jest.advanceTimersByTime(1000));
    rerender(<Page>{content}</Page>);
    expect(screen.queryByRole('tooltip')).toBeNull();

    fireEvent.pointerOver(screen.getByRole('button'));
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

  it('ignores touch pointer events by default and lets the tap through', () => {
    const onClick = jest.fn();
    render(<Page><HoverTarget onClick={onClick}/></Page>);
    const target = screen.getByRole('button');
    tap(target);
    expect(target.getAttribute('data-hovered')).toBe('false');
    expect(target.getAttribute('data-ever-hovered')).toBe('false');
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('in toggle mode, a tap opens without activating, a tap away closes, and a second tap on the anchor closes and activates', () => {
    const onClick = jest.fn();
    const onLeave = jest.fn();
    render(<Page><HoverTarget touch="toggle" onClick={onClick} onLeave={onLeave}/><p>Elsewhere</p></Page>);
    const target = screen.getByRole('button');

    tap(target);
    expect(target.getAttribute('data-hovered')).toBe('true');
    expect(target.getAttribute('data-anchored')).toBe('true');
    expect(onClick).not.toHaveBeenCalled();

    fireEvent.pointerDown(screen.getByText('Elsewhere'), { pointerType: "touch" });
    expect(target.getAttribute('data-hovered')).toBe('false');
    expect(onLeave).toHaveBeenCalledTimes(1);

    tap(target);
    expect(target.getAttribute('data-hovered')).toBe('true');
    expect(onClick).not.toHaveBeenCalled();
    tap(target);
    expect(target.getAttribute('data-hovered')).toBe('false');
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onLeave).toHaveBeenCalledTimes(2);
  });

  it('in toggle mode, a mouse click on the anchor is not swallowed', () => {
    const onClick = jest.fn();
    render(<Page><HoverTarget touch="toggle" onClick={onClick}/></Page>);
    const target = screen.getByRole('button');
    fireEvent.pointerOver(target, { pointerType: "mouse" });
    expect(target.getAttribute('data-hovered')).toBe('true');
    fireEvent.pointerDown(target, { pointerType: "mouse" });
    fireEvent.click(target);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(target.getAttribute('data-hovered')).toBe('true');
  });

  it.each([LWTooltip, TooltipSpan])('%p in toggle mode opens on tap and swallows the wrapped click', Tooltip => {
    const onClick = jest.fn();
    render(<Page><Tooltip title="Karma breakdown" touch="toggle"><button onClick={onClick}>12</button></Tooltip><p>Elsewhere</p></Page>);
    tap(screen.getByRole('button'));
    expect(screen.getByRole('tooltip')).toBeTruthy();
    expect(onClick).not.toHaveBeenCalled();
    fireEvent.pointerDown(screen.getByText('Karma breakdown'), { pointerType: "touch" });
    expect(screen.getByRole('tooltip')).toBeTruthy();
    fireEvent.pointerDown(screen.getByText('Elsewhere'), { pointerType: "touch" });
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it.each([LWTooltip, TooltipSpan])('%p ignores taps by default', Tooltip => {
    const onClick = jest.fn();
    render(<Page><Tooltip title="Back"><button onClick={onClick}>Back</button></Tooltip></Page>);
    tap(screen.getByRole('button'));
    expect(screen.queryByRole('tooltip')).toBeNull();
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
