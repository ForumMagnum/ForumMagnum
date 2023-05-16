import React, { FC, ReactNode, MouseEvent, useCallback } from "react";
import { useHistory } from "../../lib/reactRouterWrapper";

export const useClickableCell = (href: string) => {
  const history = useHistory();

  // In order to make the entire "cell" a link to the post we need some special
  // handling to make sure that all of the other links and buttons inside the cell
  // still work. We do this by checking if the click happened inside an <a> tag
  // before navigating to the post.
  const onClick = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (typeof target.closest === "function" && !target.closest("a")) {
      history.push(href);
    }
  }, [href, history]);

  return {
    onClick,
  };
}

/**
 * By default, clicking anywhere on the clickable cell will navigate to the target
 * href. If an element needs to be clickable without doing this it should be wrapped
 * in an InteractionWrapper.
 */
export const InteractionWrapper: FC<{
  children: ReactNode,
  className?: string,
}> = ({children, className}) => (
  <a
    onClick={(e) => e.stopPropagation()}
    className={className}
  >
    {children}
  </a>
);
