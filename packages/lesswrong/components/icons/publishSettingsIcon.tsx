import React from "react";

// Paper airplane with a settings gear in the top-right corner.
// The airplane has a mask cutout where the gear sits so they don't overlap.
export const PublishSettingsIcon = (props: React.HTMLAttributes<SVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <defs>
      <mask id="publishSettingsCutout">
        <rect width="28" height="28" fill="white" />
        <circle cx="16.5" cy="7.5" r="5.5" fill="black" />
      </mask>
    </defs>

    <path
      d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
      mask="url(#publishSettingsCutout)"
    />

    <g transform="translate(18, 5.5)" fill="currentColor" stroke="none">
      <path d="M4,0 A4,4 0 1,1 -4,0 A4,4 0 1,1 4,0 M1.8,0 A1.8,1.8 0 1,0 -1.8,0 A1.8,1.8 0 1,0 1.8,0" />

      <rect x="-1" y="-5.3" width="2.1" height="1.8" rx="0.4" />
      <rect x="-1" y="3.5" width="2.1" height="1.8" rx="0.4" />
      <rect x="-1" y="-5.3" width="2.1" height="1.8" rx="0.4" transform="rotate(60)" />
      <rect x="-1" y="-5.3" width="2.1" height="1.8" rx="0.4" transform="rotate(120)" />
      <rect x="-1" y="-5.3" width="2.1" height="1.8" rx="0.4" transform="rotate(240)" />
      <rect x="-1" y="-5.3" width="2.1" height="1.8" rx="0.4" transform="rotate(300)" />
    </g>
  </svg>
);
