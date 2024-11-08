import React from "react";

export const DictionaryIcon = (props: React.HTMLAttributes<SVGElement>) => {
  return (
    <svg 
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path 
        d="M4 3H18C19.1046 3 20 3.89543 20 5V19C20 20.1046 19.1046 21 18 21H4V3Z" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
};

