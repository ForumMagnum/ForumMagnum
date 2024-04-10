import React, { FC, ReactNode, MouseEvent, useCallback } from "react";
import { useNavigate } from "../../lib/reactRouterWrapper";
import { useTracking } from "../../lib/analyticsEvents";

export type ClickableCellProps = {
  /**
   * If true, the custom handler will not be triggered when the target of the
   * event is either a link, or a child tag of a link.
   */
  ignoreLinks?: boolean,
} & ({
  href: string,
  onClick?: never,
} | {
  href?: never,
  onClick: (e: MouseEvent<HTMLDivElement>) => void,
});

export const useClickableCell = ({
  ignoreLinks,
  href,
  onClick,
}: ClickableCellProps) => {
  const navigate = useNavigate();
  // Note that we only trigger this event if an href is provided
  const { captureEvent } = useTracking({eventType: "linkClicked", eventProps: {to: href}})

  // We make the entire "cell" a link. In sub-items need to be separately
  // clickable then wrap them in an `InteractionWrapper`.
  const wrappedOnClick = useCallback((e: MouseEvent<HTMLDivElement>) => {
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
      navigate(href);
    }
  }, [navigate, ignoreLinks, href, onClick, captureEvent]);

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
  children: ReactNode,
  className?: string,
}> = ({href, children, className}) => {
  const navigate = useNavigate();
  const onClick = useCallback((e: MouseEvent) => {
    e.stopPropagation();
    if (href) {
      navigate(href);
    }
  }, [navigate, href]);
  return (
    <div onClick={onClick} className={className}>
      {children}
    </div>
  );
}
