/**
 * @jest-environment jsdom
 */
import { scrollFocusOnElement } from '../lib/scrollUtils';

function addTargetElement(id: string) {
  const element = document.createElement("div");
  element.id = id;
  const rect: DOMRect = {
    x: 0,
    y: 100,
    width: 100,
    height: 20,
    top: 100,
    right: 100,
    bottom: 120,
    left: 0,
    toJSON: () => ({}),
  };
  jest.spyOn(element, "getBoundingClientRect").mockReturnValue(rect);
  document.body.appendChild(element);
}

async function flushMutationObserver() {
  await new Promise<void>((resolve) => queueMicrotask(resolve));
}

describe("scrollFocusOnElement", () => {
  let cleanup: (() => void) | null = null;

  beforeEach(() => {
    document.body.innerHTML = "";
    Object.defineProperty(window, "scrollTo", {
      configurable: true,
      value: jest.fn(),
    });
  });

  afterEach(() => {
    cleanup?.();
    cleanup = null;
  });

  it("scrolls immediately when the target is present", () => {
    addTargetElement("target");

    cleanup = scrollFocusOnElement({ id: "target" });

    expect(window.scrollTo).toHaveBeenCalledTimes(1);
  });

  it("waits for a target rendered after the scroll request", async () => {
    cleanup = scrollFocusOnElement({ id: "target" });
    expect(window.scrollTo).not.toHaveBeenCalled();

    addTargetElement("target");
    await flushMutationObserver();

    expect(window.scrollTo).toHaveBeenCalledTimes(1);
  });

  it("stops waiting when the user scrolls", async () => {
    cleanup = scrollFocusOnElement({ id: "target" });
    window.dispatchEvent(new WheelEvent("wheel"));

    addTargetElement("target");
    await flushMutationObserver();

    expect(window.scrollTo).not.toHaveBeenCalled();
  });
});
