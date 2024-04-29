import React from "react";

const UserWithLinesIcon = ({hasFill, ...props}: React.HTMLAttributes<SVGElement> & {
  hasFill?: boolean,
}) => {
  const fill = hasFill ? "currentColor" : undefined;
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M14.2506 6.65385C14.2506 8.67181 12.5714 10.3077 10.5 10.3077C8.42862 10.3077 6.74943 8.67181 6.74943 6.65385C6.74943 4.63588 8.42862 3 10.5 3C12.5714 3 14.2506 4.63588 14.2506 6.65385Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill={fill} />
      <path d="M3 20.4101C3.07032 16.4334 6.40125 13.2308 10.5 13.2308C14.5988 13.2308 17.9298 16.4335 18 20.4104C15.7169 21.431 13.1768 22 10.5003 22C7.82359 22 5.2833 21.4309 3 20.4101Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill={fill} />
      <path d="M18 8L23 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M17 11L23 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M20 14L23 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export const PeopleDirectoryIcon = (props: React.HTMLAttributes<SVGElement>) =>
  <UserWithLinesIcon {...props} />

export const PeopleDirectorySelectedIcon = (props: React.HTMLAttributes<SVGElement>) =>
  <UserWithLinesIcon {...props} hasFill />
