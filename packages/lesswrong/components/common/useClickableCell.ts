import type { MouseEvent } from "react";
import { useHistory } from "../../lib/reactRouterWrapper";

export const useClickableCell = (href: string) => {
  const history = useHistory();

  // In order to make the entire "cell" a link to the post we need some special
  // handling to make sure that all of the other links and buttons inside the cell
  // still work. We do this by checking if the click happened inside an <a> tag
  // before navigating to the post.
  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (typeof target.closest === "function" && !target.closest("a")) {
      history.push(href);
    }
  }

  return {
    onClick,
  };
}
