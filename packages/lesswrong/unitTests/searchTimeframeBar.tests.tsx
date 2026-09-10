/** @jest-environment jsdom */
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import SearchTimeframeBar from "../components/search/SearchTimeframeBar";

jest.mock("@/components/hooks/useStyles", () => ({useStyles: () => ({})}));
jest.mock("@/components/hooks/defineStyles", () => ({defineStyles: () => ({})}));

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
  fireEvent.click(screen.getByText("Zoom to selection"));
  expect(screen.getAllByText(/^\d+ Jan$/).length).toBeGreaterThan(0);
  fireEvent.click(screen.getByText("All years"));
  expect(screen.getByText("2014")).toBeTruthy();
});

it("drags an endpoint without moving the opposite date", () => {
  const onChange = jest.fn();
  render(<SearchTimeframeBar value={value} scale={scale} onChange={onChange} />);
  const track = screen.getByRole("group", {name: "Timeframe selection"});
  track.setPointerCapture = jest.fn();
  Object.defineProperty(track, "getBoundingClientRect", {value: () => ({left: 0, width: 100})});
  fireEvent.click(screen.getByText("All years"));
  fireEvent(screen.getByRole("slider", {name: "Start date"}), new MouseEvent("pointerdown", {bubbles: true, button: 0, clientX: 45}));
  fireEvent(track, new MouseEvent("pointermove", {bubbles: true, clientX: 40}));
  fireEvent.pointerUp(track);
  expect(onChange).toHaveBeenCalledWith({start: expect.any(Number), end: value.end});
  expect(onChange.mock.calls[0][0].start).toBeLessThan(value.start);
});


it("shows calendar detail when zooming and returns to year labels", () => {
  render(<SearchTimeframeBar value={value} scale={scale} onChange={jest.fn()} />);
  fireEvent.click(screen.getByText("Zoom to selection"));
  expect(screen.getAllByText(/^\d+ Jan$/)[0]).toBeTruthy();
  fireEvent.click(screen.getByText("All years"));
  expect(screen.queryByText(/^\d+ Jan$/)).toBeNull();
  expect(screen.getByText("2020")).toBeTruthy();
});

it("selects all time while initially showing six years and navigates without filtering", () => {
  const onChange = jest.fn();
  const {container} = render(<SearchTimeframeBar value={{}} scale={scale} onChange={onChange} />);
  const track = screen.getByRole("group", {name: "Timeframe selection"});
  expect(track.tabIndex).toBe(0);
  expect(screen.queryByText("2019")).toBeNull();
  expect(screen.getByText("2020")).toBeTruthy();
  expect(container.querySelector("[data-band]")).not.toBeNull();
  fireEvent.keyDown(track, {key: "ArrowLeft", shiftKey: true});
  fireEvent.keyDown(track, {key: "ArrowLeft", shiftKey: true});
  expect(screen.getByText("2019")).toBeTruthy();
  fireEvent.keyDown(screen.getByRole("slider", {name: "Start date"}), {key: "ArrowRight", ctrlKey: true});
  expect(screen.queryByText("2019")).toBeNull();
  fireEvent.keyDown(screen.getByRole("slider", {name: "End date"}), {key: "ArrowLeft", shiftKey: true});
  expect(onChange).not.toHaveBeenCalled();
});

it.each([
  {deltaX: -128, deltaMode: 0},
  {deltaX: -8, deltaMode: 1},
  {deltaX: -0.2, deltaMode: 2},
])("pans with horizontal wheel input in mode $deltaMode without filtering", ({deltaX, deltaMode}) => {
  const onChange = jest.fn();
  render(<SearchTimeframeBar value={{}} scale={scale} onChange={onChange} />);
  const track = screen.getByRole("group", {name: "Timeframe selection"});
  expect(fireEvent.wheel(track, {deltaX, deltaMode})).toBe(false);
  expect(screen.getByText("2019")).toBeTruthy();
  fireEvent.wheel(track, {deltaX: -deltaX, deltaMode});
  expect(screen.queryByText("2019")).toBeNull();
  expect(onChange).not.toHaveBeenCalled();
});

it("zooms with Ctrl+horizontal wheel and prevents browser zoom", () => {
  const onChange = jest.fn();
  render(<SearchTimeframeBar value={{}} scale={scale} onChange={onChange} />);
  const track = screen.getByRole("group", {name: "Timeframe selection"});
  expect(fireEvent.wheel(track, {deltaX: 256, ctrlKey: true})).toBe(false);
  expect(screen.queryByText("2020")).toBeNull();
  fireEvent.wheel(track, {deltaX: -256, ctrlKey: true});
  expect(screen.getByText("2020")).toBeTruthy();
  expect(onChange).not.toHaveBeenCalled();
});

it("leaves vertical wheel scrolling alone and supports Shift+wheel horizontal scrolling", () => {
  render(<SearchTimeframeBar value={{}} scale={scale} onChange={jest.fn()} />);
  const track = screen.getByRole("group", {name: "Timeframe selection"});
  expect(fireEvent.wheel(track, {deltaY: -128})).toBe(true);
  expect(screen.queryByText("2019")).toBeNull();
  expect(fireEvent.wheel(track, {deltaY: -128, shiftKey: true})).toBe(false);
  expect(screen.getByText("2019")).toBeTruthy();
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
