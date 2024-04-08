import React from "react";

const UserWithLinesIcon = ({hasFill, ...props}: React.HTMLAttributes<SVGElement> & {
  hasFill?: boolean,
}) => {
  const fill = hasFill ? "currentColor" : undefined;
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M11.8945 6.83038C11.8945 8.61468 10.448 10.0611 8.66369 10.0611C6.87938 10.0611 5.43292 8.61468 5.43292 6.83038C5.43292 5.04607 6.87938 3.59961 8.66369 3.59961C10.448 3.59961 11.8945 5.04607 11.8945 6.83038Z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" fill={fill} />
      <path d="M2.20312 18.9938C2.2637 15.4775 5.13299 12.6458 8.66369 12.6458C12.1945 12.6458 15.0638 15.4777 15.1243 18.994C13.1575 19.8965 10.9695 20.3996 8.66396 20.3996C6.35821 20.3996 4.16998 19.8964 2.20312 18.9938Z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" fill={fill} />
      <path d="M16 8L23 8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
      <path d="M15 11L23 11" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
      <path d="M18 14L23 14" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
    </svg>
  );
}

export const PeopleDirectoryIcon = (props: React.HTMLAttributes<SVGElement>) =>
  <UserWithLinesIcon {...props} />

export const PeopleDirectorySelectedIcon = (props: React.HTMLAttributes<SVGElement>) =>
  <UserWithLinesIcon {...props} hasFill />
