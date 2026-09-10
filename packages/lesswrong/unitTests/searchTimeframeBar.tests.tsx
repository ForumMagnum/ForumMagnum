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

it("zooms into the selection and restores the overview", () => {
  render(<SearchTimeframeBar value={value} scale={scale} onChange={jest.fn()} />);
  const start = screen.getByRole("slider", {name: "Start date"});
  const originalMin = start.getAttribute("aria-valuemin");
  fireEvent.click(screen.getByText("Zoom to selection"));
  expect(start.getAttribute("aria-valuemin")).not.toBe(originalMin);
  fireEvent.click(screen.getByText("All years"));
  expect(start.getAttribute("aria-valuemin")).toBe(originalMin);
});

it("drags an endpoint without moving the opposite date", () => {
  const onChange = jest.fn();
  render(<SearchTimeframeBar value={value} scale={scale} onChange={onChange} />);
  const track = screen.getByRole("group", {name: "Timeframe selection"});
  track.setPointerCapture = jest.fn();
  Object.defineProperty(track, "getBoundingClientRect", {value: () => ({left: 0, width: 100})});
  fireEvent(screen.getByRole("slider", {name: "Start date"}), new MouseEvent("pointerdown", {bubbles: true, button: 0, clientX: 45}));
  fireEvent(track, new MouseEvent("pointermove", {bubbles: true, clientX: 40}));
  fireEvent.pointerUp(track);
  expect(onChange).toHaveBeenCalledWith({start: expect.any(Number), end: value.end});
  expect(onChange.mock.calls[0][0].start).toBeLessThan(value.start);
});
