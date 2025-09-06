import { isFriendlyUI } from '@/themes/forumTheme';
import React, { FC, MouseEvent } from 'react';


export const CommentsLink: FC<{
  anchor: string;
  children: React.ReactNode;
  className?: string;
}> = ({ anchor, children, className }) => {
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const elem = document.querySelector(anchor);
    if (elem) {
      // Match the scroll behaviour from TableOfContentsList
      window.scrollTo({
        top: elem.getBoundingClientRect().y - (window.innerHeight / 3) + 1,
        behavior: "smooth",
      });
    }
  };
  return (
    <a className={className} {...(isFriendlyUI() ? { onClick } : { href: anchor })}>
      {children}
    </a>
  );
};
