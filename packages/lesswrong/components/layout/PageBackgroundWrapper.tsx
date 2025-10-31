"use client";
import React from 'react';
import classNames from 'classnames';
import { usePrerenderablePathname } from '../next/usePrerenderablePathname';
import { routeHasWhiteBackground } from './routeBackgroundColors';
import { isClient } from '@/lib/executionEnvironment';

const themeSelectorScript = `
(function _addThemeClass() {
  let themeName="default";
  try {
    const getCookie = (name) => {
      const cookie = document.cookie.split(';').filter(c=>c.trim().startsWith(name+"="))[0];
      console.log(cookie);
      if (cookie) {
        return decodeURIComponent(cookie.split("=")[1]);
      }
    }
    const themeOptions = getCookie("theme")
    themeName = themeOptions ? JSON.parse(themeOptions).name : "default";
  } catch {
  }
  document.body.classList.add("theme-"+themeName);
})()`;

function getThemeClassnameFromCookie() {
  let themeName="default";
  try {
    const getCookie = (name: string) => {
      const cookie = document.cookie.split(';').filter(c=>c.trim().startsWith(name+"="))[0];
      console.log(cookie);
      if (cookie) {
        return decodeURIComponent(cookie.split("=")[1]);
      }
    }
    const themeOptions = getCookie("theme")
    themeName = themeOptions ? JSON.parse(themeOptions).name : "default";
  } catch {
  }
  return "theme-"+themeName;
}

const bodyBackgroundStyles = `
body.whiteBackground.theme-default {
  color-scheme: light only;
  background: white;
}
body.greyBackground.theme-default{
  color-scheme: light only;
  background: #f8f4ee;
}
body.whiteBackground.theme-dark {
  color-scheme: dark only;
  background: black;
}
body.greyBackground.theme-dark {
  color-scheme: dark only;
  background: #262626;
}
@media (prefers-color-scheme: light) {
  body.whiteBackground.theme-auto {
    background: white;
  }
  body.greyBackground.theme-auto {
    background: #f8f4ee;
  }
}
@media (prefers-color-scheme: dark) {
  body.whiteBackground.theme-auto {
    background: black;
  }
  body.greyBackground.theme-auto {
    background: #262626;
  }
}
`;

export function BodyWithBackgroundColor({children}: {
  children: React.ReactNode
}) {
  const pathname = usePrerenderablePathname();
  const isWhiteBackground = routeHasWhiteBackground(pathname);
  const themeClassname = isClient && getThemeClassnameFromCookie();
  
  return <body suppressHydrationWarning className={classNames(
    isWhiteBackground && "whiteBackground",
    !isWhiteBackground && "greyBackground",
    themeClassname,
  )}>
    <script>{themeSelectorScript}</script>
    <style>{bodyBackgroundStyles}</style>
    {children}
  </body>
}

