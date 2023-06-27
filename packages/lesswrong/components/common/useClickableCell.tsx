import React, { FC, ReactNode, MouseEvent, useCallback } from "react";
import { useHistory } from "../../lib/reactRouterWrapper";

export type ClickableCellProps = {
  href: string,
  onClick?: never,
} | {
  href?: never,
  onClick: (e: MouseEvent<HTMLDivElement>) => void,
};

export const useClickableCell = ({href, onClick}: ClickableCellProps) => {
  const history = useHistory();

  // We make the entire "cell" a link. In sub-items need to be separately
  // clickable then wrap them in an `InteractionWrapper`.
  const wrappedOnClick = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (onClick) {
      onClick(e);
    } else {
      history.push(href);
    }
  }, [href, onClick, history]);

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
