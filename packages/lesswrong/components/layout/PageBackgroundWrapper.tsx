"use client";
import React from 'react';
import classNames from 'classnames';
import { usePrerenderablePathname } from '../next/usePrerenderablePathname';
import { routeHasWhiteBackground } from './routeBackgroundColors';
import { isClient } from '@/lib/executionEnvironment';
import "./pageBackground.css";

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
      if (cookie) {
        return decodeURIComponent(cookie.split("=")[1]);
      }
    }
    const themeOptions = getCookie("theme")
    themeName = themeOptions ? JSON.parse(themeOptions).name : "default";
  } catch(e) {
    // eslint-disable-next-line no-console
    console.error(`Error seting theme from cookie: ${e}`);
  }
  return "theme-"+themeName;
}

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
    {children}
    
    {/*
      Chrome has a special case where, if the page doesn't "contain visible
      text", it won't paint a frame. This winds up delaying the background-
      color paint by 500ms, which is pretty significant. As a workaround, add
      a div containing "visible" (but not really visible) text, which makes the
      background color get painted significantly sooner.
      
      Using position: absolute to avoid contributing to document height
      (which would cause unwanted scrollbars on some fullscreen routes).
    */}
    <div style={{opacity: 0.001, position: 'absolute', top: 0, left: 0}}>x</div>
  </body>
}

