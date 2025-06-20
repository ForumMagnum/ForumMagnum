import React, { FC, ReactNode, MouseEvent, useCallback } from "react";
import { useNavigate } from "../../lib/routeUtil";
import { useTracking } from "../../lib/analyticsEvents";

export type ClickableCellProps<T extends HTMLElement = HTMLDivElement> = {
  /**
   * If true, the custom handler will not be triggered when the target of the
   * event is either a link, or a child tag of a link.
   */
  ignoreLinks?: boolean,
} & ({
  href: string,
  onClick?: never,
  openInNewTab?: boolean,
} | {
  href?: never,
  onClick: (e: MouseEvent<T>) => void,
  openInNewTab?: never,
});

export const useClickableCell = <T extends HTMLElement = HTMLDivElement>({
  ignoreLinks,
  href,
  onClick,
  openInNewTab,
}: ClickableCellProps<T>) => {
  const navigate = useNavigate();
  // Note that we only trigger this event if an href is provided
  const { captureEvent } = useTracking({eventType: "linkClicked", eventProps: {to: href}})

  // We make the entire "cell" a link. In sub-items need to be separately
  // clickable then wrap them in an `InteractionWrapper`.
  const wrappedOnClick = useCallback((e: MouseEvent<T>) => {
    if (ignoreLinks && (e.target as HTMLElement).closest("a")) {
      return true;
    }

    e.preventDefault();
    e.stopPropagation();

    if (onClick) {
      onClick(e);
    } else if (e.metaKey || e.ctrlKey) {
      captureEvent();
      window.open(href, "_blank");
    } else {
      captureEvent();
      navigate(href, {openInNewTab});
    }
  }, [navigate, ignoreLinks, href, onClick, openInNewTab, captureEvent]);

  return {
    onClick: wrappedOnClick,
  };
}

/**
 * By default, clicking anywhere on the clickable cell will navigate to the target
 * href. If an element needs to be clickable without doing this it should be wrapped
 * in an InteractionWrapper.
 */
export const InteractionWrapper: FC<{
  href?: string,
  openInNewTab?: boolean,
  children: ReactNode,
  className?: string,
}> = ({href, openInNewTab, children, className}) => {
  const navigate = useNavigate();
  const onClick = useCallback((e: MouseEvent) => {
    e.stopPropagation();
    if (href) {
      navigate(href, {openInNewTab});
    }
  }, [navigate, href, openInNewTab]);
  return (
    <div onClick={onClick} className={className}>
      {children}
    </div>
  );
}
