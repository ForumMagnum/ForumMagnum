import React from "react";

export const ListViewIcon = (props: React.HTMLAttributes<SVGElement>) => {
  return (
    <svg width="14" height="13" viewBox="0 0 14 13" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="0.5" y="0.5" width="13" height="12" rx="1.5" stroke="currentColor" />
      <rect x="1" y="6" width="12" height="1" fill="currentColor" />
      <rect y="3" width="14" height="1" rx="0.5" fill="currentColor" />
      <rect y="9" width="14" height="1" rx="0.5" fill="currentColor" />
    </svg>
  );
}
