/** @jest-environment jsdom */
import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import SearchTimeframeBar from "../components/search/SearchTimeframeBar";

jest.mock("@/components/hooks/useStyles", () => ({useStyles: () => ({})}));
jest.mock("@/components/hooks/defineStyles", () => ({defineStyles: () => ({})}));

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {configurable: true, writable: true, value: jest.fn(() => ({matches: true}))});
});

const scale = {originMs: Date.UTC(2014, 0, 1), nowMs: Date.UTC(2026, 8, 10)};
const value = {start: Date.UTC(2020, 0, 1), end: Date.UTC(2020, 0, 31, 23, 59, 59, 999)};

it("adjusts endpoints independently with keyboard controls", () => {
  const onChange = jest.fn();
  render(<SearchTimeframeBar value={value} scale={scale} onChange={onChange} />);
  fireEvent.keyDown(screen.getByRole("slider", {name: "Start date"}), {key: "ArrowRight"});
  expect(onChange).toHaveBeenLastCalledWith({...value, start: Date.UTC(2020, 0, 2)});
  fireEvent.keyDown(screen.getByRole("slider", {name: "End date"}), {key: "PageDown"});
  expect(onChange).toHaveBeenLastCalledWith({...value, end: Date.UTC(2020, 0, 1, 23, 59, 59, 999)});
});

it("rejects reversed input and accepts a corrected date", () => {
  const onChange = jest.fn();
  render(<SearchTimeframeBar value={value} scale={scale} onChange={onChange} />);
  fireEvent.change(screen.getByLabelText("From date"), {target: {value: "2020-02-01"}});
  expect(onChange).not.toHaveBeenCalled();
  expect(screen.getByRole("alert").textContent).toContain("on or before");
  fireEvent.change(screen.getByLabelText("From date"), {target: {value: "2020-01-02"}});
  expect(onChange).toHaveBeenLastCalledWith({...value, start: Date.UTC(2020, 0, 2)});
  expect(screen.queryByRole("alert")).toBeNull();
});

it("discards a pointer draft on cancellation and Escape", () => {
  const onChange = jest.fn();
  render(<SearchTimeframeBar value={value} scale={scale} onChange={onChange} />);
  const track = screen.getByRole("group", {name: "Timeframe selection"});
  track.setPointerCapture = jest.fn();
  Object.defineProperty(track, "getBoundingClientRect", {value: () => ({left: 0, width: 100})});
  // jsdom does not implement PointerEvent; mouse events carry the same coordinates.
  fireEvent(track, new MouseEvent("pointerdown", {bubbles: true, button: 0, clientX: 20}));
  fireEvent(track, new MouseEvent("pointermove", {bubbles: true, clientX: 40}));
  expect(screen.getByRole("slider", {name: "Start date"}).getAttribute("aria-valuenow")).not.toBe(String(value.start));
  fireEvent.pointerCancel(track);
  fireEvent.pointerUp(track);
  expect(onChange).not.toHaveBeenCalled();
  fireEvent(track, new MouseEvent("pointerdown", {bubbles: true, button: 0, clientX: 20}));
  fireEvent.keyDown(track, {key: "Escape"});
  fireEvent.pointerUp(track);
  expect(onChange).not.toHaveBeenCalled();
  fireEvent(track, new MouseEvent("pointerdown", {bubbles: true, button: 0, clientX: 20}));
  fireEvent(track, new MouseEvent("pointermove", {bubbles: true, clientX: 40}));
  fireEvent.pointerUp(track);
  expect(onChange).toHaveBeenCalledTimes(1);
});

it("zooms into an older selection and restores all years", () => {
  render(<SearchTimeframeBar value={value} scale={scale} onChange={jest.fn()} />);
  expect(screen.queryByText("2014")).toBeNull();
  expect(screen.queryByText("Zoom to selection")).toBeNull();
  expect(screen.getAllByText(/^\d+ Jan$/).length).toBeGreaterThan(0);
  fireEvent.click(screen.getByText("All years"));
  expect(screen.getByText("2015")).toBeTruthy();
});

it("drags an endpoint without moving the opposite date", () => {
  const onChange = jest.fn();
  render(<SearchTimeframeBar value={value} scale={scale} onChange={onChange} />);
  const track = screen.getByRole("group", {name: "Timeframe selection"});
  track.setPointerCapture = jest.fn();
  Object.defineProperty(track, "getBoundingClientRect", {value: () => ({left: 0, width: 100})});
  fireEvent.click(screen.getByText("All years"));
  fireEvent(screen.getByRole("slider", {name: "Start date"}), new MouseEvent("pointerdown", {bubbles: true, button: 0, clientX: 45}));
  fireEvent(track, new MouseEvent("pointermove", {bubbles: true, clientX: 30}));
  fireEvent.pointerUp(track);
  expect(onChange).toHaveBeenCalledWith({start: expect.any(Number), end: value.end});
  expect(onChange.mock.calls[0][0].start).toBeLessThan(value.start);
});


it("shows calendar detail when zooming and returns to year labels", () => {
  render(<SearchTimeframeBar value={value} scale={scale} onChange={jest.fn()} />);
  expect(screen.queryByText("Zoom to selection")).toBeNull();
  expect(screen.getAllByText(/^\d+ Jan$/)[0]).toBeTruthy();
  fireEvent.click(screen.getByText("All years"));
  expect(screen.queryByText(/^\d+ Jan$/)).toBeNull();
  expect(screen.getByText("2021")).toBeTruthy();
});

it("shows the full archive with the start handle inset by default", () => {
  const {container} = render(<SearchTimeframeBar value={{}} scale={scale} onChange={jest.fn()} />);
  const band = container.querySelector<HTMLElement>("[data-band]");
  expect(parseFloat(band!.style.left)).toBeGreaterThan(0);
  expect(parseFloat(band!.style.left) + parseFloat(band!.style.width)).toBeLessThanOrEqual(100);
  expect(screen.getByText("2015")).toBeTruthy();
});

it.each(["Past day", "Past week", "Past month", "Past year"])("automatically fits %s with padding", label => {
  render(<SearchTimeframeBar value={{}} scale={scale} onChange={jest.fn()} />);
  fireEvent.click(screen.getByRole("checkbox", {name: label}));
  expect(screen.queryByText("2014")).toBeNull();
  expect(screen.queryByText("Zoom to selection")).toBeNull();
});

it("keeps expanding while the start handle is held at the left edge", () => {
  jest.useFakeTimers();
  const onChange = jest.fn();
  render(<SearchTimeframeBar value={value} scale={scale} onChange={onChange} />);
  const track = screen.getByRole("group", {name: "Timeframe selection"});
  track.setPointerCapture = jest.fn();
  Object.defineProperty(track, "getBoundingClientRect", {value: () => ({left: 0, width: 640})});
  const endpoint = screen.getByRole("slider", {name: "Start date"});
  const clientX = 0;
  fireEvent(endpoint, new MouseEvent("pointerdown", {bubbles: true, button: 0, clientX: 320}));
  fireEvent(track, new MouseEvent("pointermove", {bubbles: true, clientX}));
  const first = Number(endpoint.getAttribute("aria-valuenow"));
  act(() => {jest.advanceTimersByTime(500);});
  const last = Number(endpoint.getAttribute("aria-valuenow"));
  expect(last).toBeLessThan(first);
  fireEvent.pointerUp(track);
  expect(onChange).toHaveBeenCalledTimes(1);
  expect(onChange.mock.calls[0][0].end).toBe(value.end);
  jest.useRealTimers();
});

it("zooms after editing a custom date", () => {
  render(<SearchTimeframeBar value={value} scale={scale} onChange={jest.fn()} />);
  fireEvent.click(screen.getByText("All years"));
  fireEvent.change(screen.getByLabelText("From date"), {target: {value: "2020-01-15"}});
  expect(screen.queryByText("2014")).toBeNull();
  expect(screen.getAllByText(/^\d+ Jan$/).length).toBeGreaterThan(0);
});

it("labels all time with the archive start through now, independently of the viewport", () => {
  const {container} = render(<SearchTimeframeBar value={{}} scale={scale} onChange={jest.fn()} />);
  const label = container.querySelector('[aria-live="polite"]');
  expect(label?.textContent).toBe("1 Jan 2014–now");
  fireEvent.wheel(screen.getByRole("group", {name: "Timeframe selection"}), {deltaX: -128});
  expect(label?.textContent).toBe("1 Jan 2014–now");
  fireEvent.wheel(screen.getByRole("group", {name: "Timeframe selection"}), {deltaX: 256, ctrlKey: true});
  expect(label?.textContent).toBe("1 Jan 2014–now");
  expect(screen.getByRole("checkbox", {name: "All time"}).getAttribute("aria-checked")).toBe("true");
});

it.each([
  {deltaX: -128, deltaMode: 0},
  {deltaX: -8, deltaMode: 1},
  {deltaX: -0.2, deltaMode: 2},
  {deltaY: -128, shiftKey: true},
  {deltaX: 256, ctrlKey: true},
])("navigates with wheel input without changing selected dates: %j", input => {
  const onChange = jest.fn();
  const {container} = render(<SearchTimeframeBar value={value} scale={scale} onChange={onChange} />);
  const track = screen.getByRole("group", {name: "Timeframe selection"});
  const before = container.querySelector<HTMLElement>("[data-band]")!.style.cssText;
  expect(fireEvent.wheel(track, input)).toBe(false);
  expect(container.querySelector<HTMLElement>("[data-band]")!.style.cssText).not.toBe(before);
  expect(onChange).not.toHaveBeenCalled();
});

it("navigates with modified arrow keys", () => {
  const onChange = jest.fn();
  const {container} = render(<SearchTimeframeBar value={value} scale={scale} onChange={onChange} />);
  const track = screen.getByRole("group", {name: "Timeframe selection"});
  const before = container.querySelector<HTMLElement>("[data-band]")!.style.cssText;
  fireEvent.keyDown(track, {key: "ArrowLeft", shiftKey: true});
  expect(container.querySelector<HTMLElement>("[data-band]")!.style.cssText).not.toBe(before);
  fireEvent.keyDown(screen.getByRole("slider", {name: "Start date"}), {key: "ArrowRight", ctrlKey: true});
  expect(onChange).not.toHaveBeenCalled();
});

it("stops the right handle at now without revealing future dates", () => {
  jest.useFakeTimers();
  const onChange = jest.fn();
  render(<SearchTimeframeBar value={{}} scale={scale} onChange={onChange} />);
  const track = screen.getByRole("group", {name: "Timeframe selection"});
  track.setPointerCapture = jest.fn();
  Object.defineProperty(track, "getBoundingClientRect", {value: () => ({left: 0, width: 640})});
  const before = track.textContent;
  fireEvent(screen.getByRole("slider", {name: "End date"}), new MouseEvent("pointerdown", {bubbles: true, button: 0, clientX: 616}));
  fireEvent(track, new MouseEvent("pointermove", {bubbles: true, clientX: 700}));
  act(() => {jest.advanceTimersByTime(500);});
  expect(track.textContent).toBe(before);
  expect(Number(screen.getByRole("slider", {name: "End date"}).getAttribute("aria-valuenow"))).toBeLessThan(scale.nowMs + 86400000);
  fireEvent.pointerUp(track);
  jest.useRealTimers();
});

it("rejects dates before the archive begins", () => {
  const onChange = jest.fn();
  const archive = {originMs: Date.UTC(2003, 0, 1), nowMs: scale.nowMs};
  render(<SearchTimeframeBar value={{}} scale={archive} onChange={onChange} />);
  fireEvent.change(screen.getByLabelText("From date"), {target: {value: "2002-12-31"}});
  expect(onChange).not.toHaveBeenCalled();
  expect(screen.getByRole("alert").textContent).toContain("1 Jan 2003");
});

it("clamps a new selection in the left padding to the archive start", () => {
  const onChange = jest.fn();
  render(<SearchTimeframeBar value={{}} scale={scale} onChange={onChange} />);
  const track = screen.getByRole("group", {name: "Timeframe selection"});
  track.setPointerCapture = jest.fn();
  Object.defineProperty(track, "getBoundingClientRect", {value: () => ({left: 0, width: 640})});
  fireEvent(track, new MouseEvent("pointerdown", {bubbles: true, button: 0, clientX: 0}));
  fireEvent(track, new MouseEvent("pointermove", {bubbles: true, clientX: 10}));
  fireEvent.pointerUp(track);
  expect(onChange.mock.calls[0][0].start).toBe(scale.originMs);
});

it("cannot shift an existing selection into the left padding", () => {
  const onChange = jest.fn();
  const selected = {start: scale.originMs, end: scale.originMs + (7 * 86400000) - 1};
  const {container} = render(<SearchTimeframeBar value={selected} scale={scale} onChange={onChange} />);
  const track = screen.getByRole("group", {name: "Timeframe selection"});
  track.setPointerCapture = jest.fn();
  Object.defineProperty(track, "getBoundingClientRect", {value: () => ({left: 0, width: 640})});
  fireEvent(container.querySelector("[data-band]")!, new MouseEvent("pointerdown", {bubbles: true, button: 0, clientX: 320}));
  fireEvent(track, new MouseEvent("pointermove", {bubbles: true, clientX: -100}));
  fireEvent.pointerUp(track);
  expect(onChange).toHaveBeenCalledWith(selected);
});

it.each([
  {deltaY: -128, deltaMode: 0},
  {deltaY: -8, deltaMode: 1},
  {deltaY: -0.2, deltaMode: 2},
  {deltaY: -128, ctrlKey: true},
])("zooms in on upward scrolling and out on downward scrolling: %j", input => {
  const onChange = jest.fn();
  const {container} = render(<SearchTimeframeBar value={value} scale={scale} onChange={onChange} />);
  const track = screen.getByRole("group", {name: "Timeframe selection"});
  const band = container.querySelector<HTMLElement>("[data-band]")!;
  const before = parseFloat(band.style.width);
  expect(fireEvent.wheel(track, input)).toBe(false);
  const zoomed = parseFloat(band.style.width);
  expect(zoomed).toBeGreaterThan(before);
  expect(fireEvent.wheel(track, {...input, deltaY: -input.deltaY})).toBe(false);
  expect(parseFloat(band.style.width)).toBeLessThan(zoomed);
  expect(parseFloat(band.style.width)).toBeCloseTo(before);
  expect(onChange).not.toHaveBeenCalled();
});

describe("smooth selection zoom", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    Object.defineProperty(window, "matchMedia", {configurable: true, writable: true, value: jest.fn(() => ({matches: false}))});
  });
  afterEach(() => {jest.useRealTimers();});

  it.each(["preset", "typed", "dragged", "clicked"])("animates a %s selection without delaying the filter", method => {
    const onChange = jest.fn();
    const {container, rerender} = render(<SearchTimeframeBar value={{}} scale={scale} onChange={onChange} />);
    const track = screen.getByRole("group", {name: "Timeframe selection"});
    const band = container.querySelector<HTMLElement>("[data-band]")!;
    if (method === "preset") {
      fireEvent.click(screen.getByRole("checkbox", {name: "Past month"}));
    } else if (method === "typed") {
      fireEvent.change(screen.getByLabelText("From date"), {target: {value: "2026-08-01"}});
    } else {
      track.setPointerCapture = jest.fn();
      Object.defineProperty(track, "getBoundingClientRect", {value: () => ({left: 0, width: 640})});
      fireEvent(track, new MouseEvent("pointerdown", {bubbles: true, button: 0, clientX: 300}));
      if (method === "dragged") fireEvent(track, new MouseEvent("pointermove", {bubbles: true, clientX: 400}));
      fireEvent.pointerUp(track);
    }
    expect(onChange).toHaveBeenCalledTimes(1);
    rerender(<SearchTimeframeBar value={onChange.mock.calls[0][0]} scale={scale} onChange={onChange} />);
    const initial = band.style.cssText;
    act(() => {jest.advanceTimersByTime(144);});
    const middle = band.style.cssText;
    expect(middle).not.toBe(initial);
    act(() => {jest.advanceTimersByTime(200);});
    expect(band.style.cssText).not.toBe(middle);
    const finished = band.style.cssText;
    act(() => {jest.advanceTimersByTime(500);});
    expect(band.style.cssText).toBe(finished);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("starts a replacement zoom from the current view and cancels it on unmount", () => {
    const {container, unmount} = render(<SearchTimeframeBar value={value} scale={scale} onChange={jest.fn()} />);
    fireEvent.click(screen.getByRole("checkbox", {name: "Past month"}));
    act(() => {jest.advanceTimersByTime(80);});
    const before = container.innerHTML;
    fireEvent.click(screen.getByRole("checkbox", {name: "Past year"}));
    expect(container.innerHTML).toBe(before);
    act(() => {jest.advanceTimersByTime(80);});
    expect(container.innerHTML).not.toBe(before);
    unmount();
    expect(jest.getTimerCount()).toBe(0);
  });

  it("freezes the current view when starting a new drag", () => {
    render(<SearchTimeframeBar value={value} scale={scale} onChange={jest.fn()} />);
    fireEvent.click(screen.getByRole("checkbox", {name: "Past month"}));
    act(() => {jest.advanceTimersByTime(80);});
    const track = screen.getByRole("group", {name: "Timeframe selection"});
    track.setPointerCapture = jest.fn();
    Object.defineProperty(track, "getBoundingClientRect", {value: () => ({left: 0, width: 640})});
    fireEvent(track, new MouseEvent("pointerdown", {bubbles: true, button: 0, clientX: 300}));
    const interrupted = track.innerHTML;
    act(() => {jest.advanceTimersByTime(500);});
    expect(track.innerHTML).toBe(interrupted);
  });

  it("lets wheel input interrupt an animation", () => {
    const {container} = render(<SearchTimeframeBar value={value} scale={scale} onChange={jest.fn()} />);
    fireEvent.click(screen.getByRole("checkbox", {name: "Past month"}));
    act(() => {jest.advanceTimersByTime(80);});
    fireEvent.wheel(screen.getByRole("group", {name: "Timeframe selection"}), {deltaY: 128});
    const interrupted = container.innerHTML;
    act(() => {jest.advanceTimersByTime(500);});
    expect(container.innerHTML).toBe(interrupted);
  });
});
