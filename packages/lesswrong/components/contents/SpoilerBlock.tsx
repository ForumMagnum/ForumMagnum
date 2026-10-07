import React, { useCallback, useRef, useState } from "react";
import classNames from "classnames";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import { hideSpoilers } from "@/themes/stylePiping";

const spoilerClassNames = new Set(["spoilers", "spoiler", "spoiler-v2"]);

export const containsSpoilerClassName = (classes: string[]) =>
  classes.some(className => spoilerClassNames.has(className));

export const removeSpoilerClassNames = (classes: string[]) =>
  classes.filter(className => !spoilerClassNames.has(className));

const styles = defineStyles("SpoilerBlock", (theme: ThemeType) => ({
  root: {
    margin: "1em 0",
  },
  inlineRoot: {
    display: "inline",
    padding: "2px 4px",
  },
  // A block spoiler whose contents are inline (eg a legacy `p.spoiler`), which
  // is hidden and revealed as a single unit.
  wholeBlockRoot: {
    padding: 8,
    minHeight: 15,
    position: "relative",
    isolation: "isolate",
  },
  revealed: {
    // Leaves a light grey background over the revealed spoiler to make it
    // more obvious where it started and ended.
    background: theme.palette.panelBackground.revealedSpoilerBlock,
  },
  child: {
    padding: "0.5em 8px",
    position: "relative",
    isolation: "isolate",
    "& > *": {
      marginTop: "0 !important",
      marginBottom: "0 !important",
    },
  },
  // Hidden content is covered by an opaque overlay, rather than recolored,
  // so that we don't have to chase down every text, border, and background
  // color that user content (or the theme) might set inside it. The wrapper
  // is its own stacking context, so the overlay only has to out-stack the
  // content inside it.
  overlay: {
    position: "absolute",
    inset: 0,
    zIndex: 1000,
    background: theme.palette.panelBackground.spoilerBlock,
  },
  // An inline spoiler can wrap across lines, which an absolutely-positioned
  // overlay can't cover reliably, so it's hidden by recoloring instead.
  inlineHidden: {
    "&&": {
      ...hideSpoilers(theme),
      "&::selection, & ::selection": {
        backgroundColor: "transparent",
      },
    },
  },
}));

const interactiveElementSelector = 'a, button, input, select, textarea, summary, [role="button"]';

function isTouchPointer(ev: React.PointerEvent): boolean {
  return ev.pointerType === "touch";
}

function targetIsInteractiveElement(target: EventTarget | null): boolean {
  return target instanceof Element && !!target.closest(interactiveElementSelector);
}

const SpoilerOverlay = () => {
  const classes = useStyles(styles);
  return <div className={classes.overlay} aria-hidden="true" />;
};

const SpoilerBlockChild = ({ index, hidden, onHoverChange, children }: {
  index: number;
  hidden: boolean;
  onHoverChange: (index: number, hovered: boolean) => void;
  children: React.ReactNode;
}) => {
  const classes = useStyles(styles);
  return (
    <div
      className={classes.child}
      onPointerEnter={(ev) => {
        if (!isTouchPointer(ev)) onHoverChange(index, true);
      }}
      onPointerLeave={(ev) => {
        if (!isTouchPointer(ev)) onHoverChange(index, false);
      }}
    >
      {children}
      {hidden && <SpoilerOverlay />}
    </div>
  );
};

interface SpoilerBlockProps {
  attributes: React.HTMLAttributes<HTMLElement>;
  children: React.ReactNode;
  /** The spoiler element itself is inline, eg a legacy `<span class="spoiler">`. */
  inline?: boolean;
  /**
   * The spoiler's children are all block-level elements (the normal case for a
   * `<div class="spoilers">`). Hovering then reveals the children only up to
   * the hovered one, rather than the whole block at once.
   */
  hasBlockChildren?: boolean;
}

/**
 * Renders a spoiler block from a post/comment body. The contents are drawn
 * as black-on-black, the same size as they would be if revealed.
 *
 * With a mouse, hovering over the block reveals it, and hovering over one of
 * its block-level children reveals only the children up to that one. The
 * hover only counts once we've seen a pointerenter event on the block: if the
 * cursor started out inside it (eg the page loaded or scrolled with the
 * cursor already there), nothing is revealed until the cursor leaves and
 * re-enters.
 *
 * On touch devices, hovering isn't a coherent concept, so a tap toggles
 * revealing the whole block. This uses the browser's click event, so it's
 * filtered the same way as taps on buttons are: a swipe that scrolls the page
 * doesn't count.
 */
const SpoilerBlock = ({ attributes, children, inline = false, hasBlockChildren = false }: SpoilerBlockProps) => {
  const classes = useStyles(styles);
  const [hovering, setHovering] = useState(false);
  const [hoveredChildIndex, setHoveredChildIndex] = useState<number | null>(null);
  const [tapRevealed, setTapRevealed] = useState(false);
  const lastPointerTypeRef = useRef<string | null>(null);

  const handlePointerEnter = (ev: React.PointerEvent) => {
    if (!isTouchPointer(ev)) {
      setHovering(true);
    }
  };
  const handlePointerLeave = (ev: React.PointerEvent) => {
    if (!isTouchPointer(ev)) {
      setHovering(false);
      setHoveredChildIndex(null);
    }
  };
  const handleChildHoverChange = useCallback((index: number, hovered: boolean) => {
    if (hovered) {
      setHoveredChildIndex(index);
    } else {
      setHoveredChildIndex(current => current === index ? null : current);
    }
  }, []);

  const handlePointerDown = (ev: React.PointerEvent) => {
    lastPointerTypeRef.current = ev.pointerType;
  };
  const handleClick = (ev: React.MouseEvent) => {
    const pointerType = lastPointerTypeRef.current;
    lastPointerTypeRef.current = null;
    if (pointerType !== "touch") {
      return;
    }
    if (tapRevealed) {
      // Taps on links and buttons inside a revealed spoiler do their normal
      // thing rather than re-hiding it.
      if (targetIsInteractiveElement(ev.target)) {
        return;
      }
      setTapRevealed(false);
    } else {
      // Don't follow a link the user couldn't see.
      ev.preventDefault();
      setTapRevealed(true);
    }
  };

  const wholeBlockRevealed = tapRevealed || (hovering && hoveredChildIndex === null);
  const isChildRevealed = (index: number) =>
    tapRevealed || (hovering && (hoveredChildIndex === null || index <= hoveredChildIndex));

  const RootTag = inline ? "span" : "div";
  const childArray = hasBlockChildren ? React.Children.toArray(children) : null;

  return (
    <RootTag
      {...attributes}
      className={classNames(
        attributes.className,
        inline ? classes.inlineRoot : classes.root,
        !inline && !hasBlockChildren && classes.wholeBlockRoot,
        wholeBlockRevealed && classes.revealed,
        inline && !wholeBlockRevealed && classes.inlineHidden,
      )}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
    >
      {childArray
        ? childArray.map((child, index) => (
          <SpoilerBlockChild
            key={index}
            index={index}
            hidden={!isChildRevealed(index)}
            onHoverChange={handleChildHoverChange}
          >
            {child}
          </SpoilerBlockChild>
        ))
        : children}
      {!inline && !hasBlockChildren && !wholeBlockRevealed && <SpoilerOverlay />}
    </RootTag>
  );
};

export default SpoilerBlock;
