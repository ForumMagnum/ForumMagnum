import React from "react";

export const MenuIcon = (props: React.HTMLAttributes<SVGElement>) => {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M2 5H18M2 10.25H18M2 15.5H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
