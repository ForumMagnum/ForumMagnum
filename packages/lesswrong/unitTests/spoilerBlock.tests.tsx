/**
 * @jest-environment jsdom
 */
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import SpoilerBlock, {
  containsSpoilerClassName,
  removeSpoilerClassNames,
} from "@/components/contents/SpoilerBlock";

jest.mock("@/components/hooks/useStyles", () => ({
  defineStyles: () => ({}),
  useStyles: () => ({
    root: "spoiler-root",
    inlineRoot: "spoiler-inline-root",
    wholeBlockRoot: "spoiler-whole-block-root",
    revealed: "spoiler-revealed",
    child: "spoiler-child",
    overlay: "spoiler-overlay",
    inlineHidden: "spoiler-inline-hidden",
  }),
}));

jest.mock("@/themes/stylePiping", () => ({
  hideSpoilers: () => ({}),
}));

type PointerType = "mouse" | "touch";

/**
 * jsdom doesn't implement PointerEvent, so build a plain event and attach the
 * fields React reads. React derives onPointerEnter/onPointerLeave from
 * pointerover/pointerout pairs, using relatedTarget to work out which
 * elements were entered and left.
 */
function firePointerEvent(
  target: Element,
  type: "pointerover" | "pointerout" | "pointerdown",
  pointerType: PointerType,
  relatedTarget: Element | null = null,
) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, "pointerType", { value: pointerType });
  Object.defineProperty(event, "relatedTarget", { value: relatedTarget });
  fireEvent(target, event);
}

const mouseEnter = (target: Element) => firePointerEvent(target, "pointerover", "mouse");
const mouseLeave = (target: Element) => firePointerEvent(target, "pointerout", "mouse");
const mouseMoveBetween = (from: Element, to: Element) =>
  firePointerEvent(from, "pointerout", "mouse", to);

function tap(target: Element) {
  firePointerEvent(target, "pointerdown", "touch");
  return fireEvent.click(target);
}

function renderBlockSpoiler() {
  const { container } = render(
    <SpoilerBlock attributes={{ className: "other-class" }} hasBlockChildren>
      <p>first</p>
      <blockquote><p>second</p></blockquote>
      <p>third</p>
    </SpoilerBlock>,
  );
  const root = container.querySelector(".spoiler-root")!;
  const children = Array.from(container.querySelectorAll(".spoiler-child"));
  return { container, root, children };
}

// Hidden block content is covered by an overlay element inside its wrapper
const isHidden = (element: Element) => !!element.querySelector(":scope > .spoiler-overlay");

describe("SpoilerBlock", () => {
  it("hides block-level children until the mouse enters, then reveals up to the hovered child", () => {
    const { container, root, children } = renderBlockSpoiler();
    expect(children).toHaveLength(3);
    expect(children.map(isHidden)).toEqual([true, true, true]);
    expect(container.querySelector(".other-class")).toBe(root);

    // Enter the block directly onto the first child
    mouseEnter(screen.getByText("first"));
    expect(children.map(isHidden)).toEqual([false, true, true]);

    // Move down to the second child: everything up to it is revealed
    mouseMoveBetween(screen.getByText("first"), screen.getByText("second"));
    expect(children.map(isHidden)).toEqual([false, false, true]);

    // Move back up to the first child: the second is hidden again
    mouseMoveBetween(screen.getByText("second"), screen.getByText("first"));
    expect(children.map(isHidden)).toEqual([false, true, true]);

    // Leave the block entirely
    mouseLeave(screen.getByText("first"));
    expect(children.map(isHidden)).toEqual([true, true, true]);
    expect(root).not.toHaveClass("spoiler-revealed");
  });

  it("reveals everything when hovering the block but not any particular child", () => {
    const { root, children } = renderBlockSpoiler();
    mouseEnter(root);
    expect(children.map(isHidden)).toEqual([false, false, false]);
    expect(root).toHaveClass("spoiler-revealed");
  });

  it("ignores a cursor that started out inside the block until it leaves and re-enters", () => {
    const { children } = renderBlockSpoiler();

    // The cursor was already inside the block and moves between children,
    // without ever having entered the block
    mouseMoveBetween(screen.getByText("first"), screen.getByText("second"));
    expect(children.map(isHidden)).toEqual([true, true, true]);
    mouseMoveBetween(screen.getByText("second"), screen.getByText("third"));
    expect(children.map(isHidden)).toEqual([true, true, true]);

    mouseLeave(screen.getByText("third"));
    mouseEnter(screen.getByText("third"));
    expect(children.map(isHidden)).toEqual([false, false, false]);
  });

  it("does not treat touch pointer events as hovering", () => {
    const { children } = renderBlockSpoiler();
    firePointerEvent(screen.getByText("first"), "pointerover", "touch");
    expect(children.map(isHidden)).toEqual([true, true, true]);
  });

  it("toggles the whole block on tap, but not on mouse click", () => {
    const { root, children } = renderBlockSpoiler();

    firePointerEvent(screen.getByText("first"), "pointerdown", "mouse");
    fireEvent.click(screen.getByText("first"));
    expect(children.map(isHidden)).toEqual([true, true, true]);

    tap(screen.getByText("first"));
    expect(children.map(isHidden)).toEqual([false, false, false]);
    expect(root).toHaveClass("spoiler-revealed");

    tap(screen.getByText("third"));
    expect(children.map(isHidden)).toEqual([true, true, true]);
  });

  it("does not follow a link tapped inside a hidden spoiler, but does once revealed", () => {
    render(
      <SpoilerBlock attributes={{}} hasBlockChildren>
        <p><a href="https://example.com">secret link</a></p>
        <p>more</p>
      </SpoilerBlock>,
    );
    const link = screen.getByText("secret link");

    const clickWhileHidden = tap(link);
    expect(clickWhileHidden).toBe(false);
    expect(isHidden(link.closest(".spoiler-child")!)).toBe(false);

    const clickWhileRevealed = tap(link);
    expect(clickWhileRevealed).toBe(true);
    expect(isHidden(link.closest(".spoiler-child")!)).toBe(false);
  });

  it("hides and reveals a block with inline contents as a single unit", () => {
    const { container } = render(
      <SpoilerBlock attributes={{}}>
        just some text
      </SpoilerBlock>,
    );
    const root = container.querySelector(".spoiler-root")!;
    expect(root).toHaveClass("spoiler-whole-block-root");
    expect(isHidden(root)).toBe(true);
    expect(container.querySelector(".spoiler-child")).toBeNull();

    mouseEnter(root);
    expect(isHidden(root)).toBe(false);
    expect(root).toHaveClass("spoiler-revealed");

    mouseLeave(root);
    expect(isHidden(root)).toBe(true);
  });

  it("uses inline markup for legacy inline spoilers", () => {
    render(
      <p>
        Before
        <SpoilerBlock attributes={{}} inline>
          inline secret
        </SpoilerBlock>
        after
      </p>,
    );
    const root = screen.getByText("inline secret");
    expect(root.tagName).toBe("SPAN");
    expect(root).toHaveClass("spoiler-inline-root");
    expect(root).toHaveClass("spoiler-inline-hidden");
    expect(root.querySelector(".spoiler-overlay")).toBeNull();

    tap(root);
    expect(root).not.toHaveClass("spoiler-inline-hidden");
  });

  it("recognizes and removes current and legacy spoiler classes", () => {
    const classes = ["layout", "spoilers", "spoiler", "spoiler-v2"];

    expect(containsSpoilerClassName(classes)).toBe(true);
    expect(removeSpoilerClassNames(classes)).toEqual(["layout"]);
    expect(containsSpoilerClassName(["layout"])).toBe(false);
  });
});
