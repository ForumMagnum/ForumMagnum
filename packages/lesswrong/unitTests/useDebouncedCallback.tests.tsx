/**
 * @jest-environment jsdom
 */
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { DebouncedCallbackOptions, useDebouncedCallback } from '../components/hooks/useDebouncedCallback';

jest.useFakeTimers();

describe('useDebouncedCallback', () => {
  const ComponentWithDebouncedCallbackHook = ({fn, debouncedFnRef, options}: {
    fn: (args: any) => void
    debouncedFnRef: {debouncedFn: ((args: any) => void)|null}
    options: DebouncedCallbackOptions
  }) => {
    const debouncedFn = useDebouncedCallback(fn, options);
    debouncedFnRef.debouncedFn = debouncedFn;
    return <div/>
  }

  it('replaces arguments with latest if called while waiting', () => {
    const container = document.createElement("div");
    const root = createRoot(container);
    document.body.appendChild(container);
    const fn: (args: any) => void = jest.fn();
    const debouncedFnRef: {debouncedFn: ((args: any) => void)|null} = {debouncedFn: null};

    act(() => {
      root.render(<ComponentWithDebouncedCallbackHook
        fn={fn} debouncedFnRef={debouncedFnRef}
        options={{
          rateLimitMs: 1000,
          callOnLeadingEdge: true,
          onUnmount: "callIfScheduled",
          allowExplicitCallAfterUnmount: false,
        }}
      />);
    });
    
    expect(fn).toHaveBeenCalledTimes(0);
    
    // Should call immediately because callOnLeadingEdge was true
    debouncedFnRef.debouncedFn!({arg:"x"});
    expect(fn).toHaveBeenCalledTimes(1);
    
    // Call it a couple times with different arguments, before the rate limit
    jest.advanceTimersByTime(100);
    debouncedFnRef.debouncedFn!({arg:"y"});
    jest.advanceTimersByTime(100);
    debouncedFnRef.debouncedFn!({arg:"z"});
    
    // Wait until it triggers
    jest.advanceTimersByTime(1000);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith({arg:"z"});
  });

  it('calls the callback on unmount if pending', () => {
    const container = document.createElement("div");
    const root = createRoot(container);
    document.body.appendChild(container);
    const fn: (args: any) => void = jest.fn();
    const debouncedFnRef: {debouncedFn: ((args: any) => void)|null} = {debouncedFn: null};

    act(() => {
      root.render(<ComponentWithDebouncedCallbackHook
        fn={fn} debouncedFnRef={debouncedFnRef}
        options={{
          rateLimitMs: 1000,
          callOnLeadingEdge: false,
          onUnmount: "callIfScheduled",
          allowExplicitCallAfterUnmount: false,
        }}
      />);
    });
    
    expect(fn).toHaveBeenCalledTimes(0);
    
    // Should not call immediately because callOnLeadingEdge was false
    debouncedFnRef.debouncedFn!({});
    expect(fn).toHaveBeenCalledTimes(0);
    
    // 500ms is not long enough to trigger
    jest.advanceTimersByTime(500);
    expect(fn).toHaveBeenCalledTimes(0);
    
    // Unmount. Should cause it to be called.
    act(() => {
      root.unmount();
    });
    expect(fn).toHaveBeenCalledTimes(1);
    
    // Attempt to call it. Should be blocked because allowExplicitCallAfterUnmount is false.
    debouncedFnRef.debouncedFn!({});
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
