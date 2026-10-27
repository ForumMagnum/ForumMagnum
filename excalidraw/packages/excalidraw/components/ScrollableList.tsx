// Vendored from: https://github.com/excalidraw/excalidraw/commit/a52cd200927a975322934b42b966133232724bad
import clsx from "clsx";
import { Children } from "react";

import "./ScrollableList.scss";

interface ScrollableListProps {
  className?: string;
  placeholder: string;
  children: React.ReactNode;
}

export const ScrollableList = ({
  className,
  placeholder,
  children,
}: ScrollableListProps) => {
  const isEmpty = !Children.count(children);

  return (
    <div className={clsx("ScrollableList__wrapper", className)} role="menu">
      {isEmpty ? <div className="empty">{placeholder}</div> : children}
    </div>
  );
};
