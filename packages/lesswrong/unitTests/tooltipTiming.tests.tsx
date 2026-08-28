/**
 * @jest-environment jsdom
 */
import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { TooltipTimingProvider, useTooltipOpenDelay } from "../components/common/TooltipTiming";

jest.useFakeTimers();

const TooltipProbe = ({ hovered, name }: {
  hovered: boolean
  name: string
}) => {
  const open = useTooltipOpenDelay(hovered, true);
  return <div data-open={open} data-testid={name}/>;
};

function renderProbes(root: Root, hovered: string | null) {
  act(() => {
    root.render(
      <TooltipTimingProvider>
        <TooltipProbe hovered={hovered === "first"} name="first"/>
        <TooltipProbe hovered={hovered === "second"} name="second"/>
        <TooltipProbe hovered={hovered === "third"} name="third"/>
      </TooltipTimingProvider>,
    );
  });
}

function isOpen(container: HTMLElement, name: string): boolean {
  return container.querySelector(`[data-testid="${name}"]`)?.getAttribute("data-open") === "true";
}

describe("tooltip timing", () => {
  it("cancels a delayed tooltip when the pointer leaves early", () => {
    const container = document.createElement("div");
    const root = createRoot(container);

    renderProbes(root, "first");
    act(() => {
      jest.advanceTimersByTime(50);
    });
    renderProbes(root, null);
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(isOpen(container, "first")).toBe(false);

    renderProbes(root, "second");
    expect(isOpen(container, "second")).toBe(false);

    act(() => root.unmount());
  });

  it("skips the delay during the warm window, then restores it", () => {
    const container = document.createElement("div");
    const root = createRoot(container);

    renderProbes(root, "first");
    expect(isOpen(container, "first")).toBe(false);

    act(() => {
      jest.advanceTimersByTime(74);
    });
    expect(isOpen(container, "first")).toBe(false);

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(isOpen(container, "first")).toBe(true);

    renderProbes(root, null);
    renderProbes(root, "second");
    expect(isOpen(container, "second")).toBe(true);

    renderProbes(root, null);
    act(() => {
      jest.advanceTimersByTime(300);
    });
    renderProbes(root, "third");
    expect(isOpen(container, "third")).toBe(false);

    act(() => {
      jest.advanceTimersByTime(75);
    });
    expect(isOpen(container, "third")).toBe(true);

    act(() => root.unmount());
  });
});
