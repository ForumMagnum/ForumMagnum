import React from "react";

export const SoftUpArrowIcon = ({width=9, height=6, ...props}: {
  width?: number,
  height?: number
  className?: string,
  onClick?: React.MouseEventHandler<SVGElement>,
  onMouseDown?: React.MouseEventHandler<SVGElement>,
}) => {
  return (
    <svg width={width} height={height} viewBox="0 0 9 6" fill="currentColor" {...props}>
      <path d="M4.11 0.968C4.31 0.725 4.69 0.725 4.89 0.968L8.16 4.932C8.42 5.26 8.19 5.75 7.77 5.75H1.23C0.808 5.75 0.576 5.26 0.845 4.93L4.11 0.968Z"/>
    </svg>
  );
}
