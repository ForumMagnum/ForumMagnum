import React from "react";

/**
 * A circular arrow around a number of seconds: the usual icon for skipping
 * back or forward by that much. The arrowhead and the arc don't overlap, since
 * the icon may be drawn in a translucent color, and would be darker where
 * they did.
 */
const NarrationSkipIcon = ({ direction, seconds }: {
  direction: "back"|"forward"
  seconds: number
}) => {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
    <g
      transform={direction === "forward" ? "translate(24 0) scale(-1 1)" : undefined}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5.29 9.38A7.75 7.75 0 1 0 12.85 5.55" />
      <path d="M12 2.6 8.2 5.5 12 8.4Z" fill="currentColor" stroke="none" />
    </g>
    <text
      x="12"
      y="13.5"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize="7.5"
      fontWeight="700"
      fill="currentColor"
    >
      {seconds}
    </text>
  </svg>;
};

export default NarrationSkipIcon;
