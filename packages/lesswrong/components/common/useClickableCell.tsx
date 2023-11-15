import React, { FC, ReactNode, MouseEvent, useCallback } from "react";
import { useHistory } from "../../lib/reactRouterWrapper";
import { useTracking } from "../../lib/analyticsEvents";

export type ClickableCellProps = {
  href: string,
  onClick?: never,
} | {
  href?: never,
  onClick: (e: MouseEvent<HTMLDivElement>) => void,
};

export const useClickableCell = ({href, onClick}: ClickableCellProps) => {
  const history = useHistory();
  // Note that we only trigger this event if an href is provided
  const { captureEvent } = useTracking({eventType: "linkClicked", eventProps: {to: href}})

  // We make the entire "cell" a link. In sub-items need to be separately
  // clickable then wrap them in an `InteractionWrapper`.
  const wrappedOnClick = useCallback((e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (onClick) {
      onClick(e);
    } else if (e.metaKey || e.ctrlKey) {
      captureEvent();
      window.open(href, "_blank");
    } else {
      captureEvent();
      history.push(href);
    }
  }, [href, onClick, history, captureEvent]);

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
  const history = useHistory();
  const onClick = useCallback((e: MouseEvent) => {
    e.stopPropagation();
    if (href) {
      history.push(href);
    }
  }, [href, history]);
  return (
    <div onClick={onClick} className={className}>
      {children}
    </div>
  );
}
