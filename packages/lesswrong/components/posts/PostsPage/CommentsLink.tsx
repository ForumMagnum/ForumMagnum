import React, { FC } from 'react';


export const CommentsLink: FC<{
  anchor: string;
  children: React.ReactNode;
  className?: string;
}> = ({ anchor, children, className }) => {
  return (
    <a className={className} href={anchor}>
      {children}
    </a>
  );
};
