import React, { useEffect, useState } from 'react';
import { isClient } from '@/lib/executionEnvironment';

type ExternalScriptState = {
  loading: boolean
  href: string
  onReady: Array<() => void>
};
declare global {
  interface Window {
    externalScripts?: Array<ExternalScriptState>
  }
}

/**
 * Loads an external Javascript dependency, by injecting a <script> tag into
 * the page header. Used for external client-side Javascript APIs such as
 * Type3 Audio.
 *
 * Once a script is loaded this way, it stays loaded even if you navigate the
 * tab and this hook is no longer present. This is because removing a script
 * tag from the DOM will often not actually clean it up; repeatedly removing
 * a script tag and then adding it back is likely to be a memory leak.
 *
 * `scriptProps` adds props to the script tag; these should not be changed
 * after first render (changes won't be applied as the tag has already been
 * added).
 */
export const useExternalScript = (href: string, scriptProps: Partial<Record<string,string>>): {
  ready: boolean
} => {
  const [ready, setReady] = useState(() => {
    if (isClient) {
      const scriptState = window.externalScripts?.find(s => s.href === href)
      if (!scriptState) return false;
      return !scriptState.loading;
    } else {
      return false;
    }
  });

  useEffect(() => {
    const existingScriptState = window.externalScripts?.find(s => s.href === href)
    
    if (!existingScriptState) {
      // If the script isn't loaded and its load hasn't been started it, start loading
      if (!window.externalScripts) {
        window.externalScripts = [];
      }
      const scriptState: ExternalScriptState = {loading: true,  href, onReady: []}
      window.externalScripts.push(scriptState);
      
      const scriptTag = document.createElement("script");
      scriptTag.async = true;
      scriptTag.src = href;
      for (const key in scriptProps) {
        scriptTag.setAttribute(key, scriptProps[key] ?? "");
      }
      scriptTag.onerror = () => {
        // If the script fails to load, remove it from window.externalScripts
        // so that if we navigate and return, it will try loading again.
        if (window.externalScripts) {
          window.externalScripts = window.externalScripts.filter(s => s.href !== href);
        }
      }
      scriptTag.onload = () => {
        for (let onReadyCallback of [...scriptState.onReady]) {
          onReadyCallback();
        }
      }
      scriptState.onReady.push(() => {
        setReady(true);
        scriptState.loading = false;
        scriptTag.onload = scriptTag.onerror = null;
      });
      document.head.appendChild(scriptTag);
    } else if (existingScriptState.loading) {
      // If the script is already loading, add to its onload/onerror events so we
      // get notified when it's ready
      existingScriptState.onReady.push(() => {
        setReady(true);
      });
    } else {
      setReady(true);
    }
  // Ignore `scriptProps` being missing from the useEffect dependency list
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [href]);
  
  return {ready};
}
