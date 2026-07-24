/**
 * @jest-environment jsdom
 */

import { scrollFocusOnElement } from "@/lib/scrollUtils";

const flushMutationObserver = () => new Promise(resolve => setTimeout(resolve, 0));

function setElementBounds(element: HTMLElement, top: number) {
  element.getBoundingClientRect = () => ({
    x: 0,
    y: top,
    width: 100,
    height: 40,
    top,
    right: 100,
    bottom: top + 40,
    left: 0,
    toJSON: () => {},
  });
}

describe("scrollFocusOnElement", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    Object.defineProperty(window, "innerHeight", {
      value: 1000,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, "scrollY", {
      value: 0,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, "scrollTo", {
      value: jest.fn(),
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    window.dispatchEvent(new Event("mousedown"));
    jest.clearAllMocks();
  });

  it("scrolls immediately when the target element is already mounted", () => {
    const comment = document.createElement("div");
    comment.id = "mounted-comment";
    setElementBounds(comment, 500);
    document.body.append(comment);

    scrollFocusOnElement({ id: "mounted-comment", options: { behavior: "smooth" } });

    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 326,
      behavior: "smooth",
    });
  });

  it("waits for a missing target element to mount before scrolling", async () => {
    scrollFocusOnElement({ id: "delayed-comment", options: { behavior: "smooth" } });

    expect(window.scrollTo).not.toHaveBeenCalled();

    const comment = document.createElement("div");
    comment.id = "delayed-comment";
    setElementBounds(comment, 500);
    document.body.append(comment);
    await flushMutationObserver();

    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 326,
      behavior: "smooth",
    });
  });

  it("cancels an old pending scroll when a newer target is requested", async () => {
    scrollFocusOnElement({ id: "old-comment" });
    scrollFocusOnElement({ id: "new-comment" });

    const oldComment = document.createElement("div");
    oldComment.id = "old-comment";
    setElementBounds(oldComment, 500);
    document.body.append(oldComment);
    await flushMutationObserver();

    expect(window.scrollTo).not.toHaveBeenCalled();

    const newComment = document.createElement("div");
    newComment.id = "new-comment";
    setElementBounds(newComment, 600);
    document.body.append(newComment);
    await flushMutationObserver();

    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 426,
    });
  });

  it("cancels a pending scroll when the user manually scrolls", async () => {
    scrollFocusOnElement({ id: "delayed-comment" });

    window.dispatchEvent(new Event("wheel"));

    const comment = document.createElement("div");
    comment.id = "delayed-comment";
    setElementBounds(comment, 500);
    document.body.append(comment);
    await flushMutationObserver();

    expect(window.scrollTo).not.toHaveBeenCalled();
  });
});
