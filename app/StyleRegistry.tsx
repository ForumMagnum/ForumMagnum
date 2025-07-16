'use client'

import React, { useState, useRef } from 'react'
import { useServerInsertedHTML } from 'next/navigation'
import { StylesContext, StylesContextType, setClientMountedStyles } from '@/components/hooks/useStyles'
import { getForumTheme } from '@/themes/forumTheme'
import type { ThemeOptions } from '@/themes/themeNames'
import { getJss } from '@/lib/jssStyles'
import { requestedCssVarsToString } from '@/themes/cssVars'
import miscStyles from '@/themes/globalStyles/miscStyles'

const applyStylesScript = `function applyStyles(themeName) {
  // Sort all collected styles by priority
  const sortedStyles = Array.from(window.__collectedStyles.styles.values())
    .sort((a, b) => {
      // Sort by priority first (lower number = higher priority)
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      // Then by name for stable ordering
      return a.name.localeCompare(b.name);
    });
  
  // Create a single style element with all styles in order
  const styleTagId = 'jss-sorted-styles-' + themeName;
  const styleEl = document.getElementById(styleTagId) || document.createElement('style');
  styleEl.id = styleTagId;
  styleEl.textContent = sortedStyles.map(s => s.cssRules).join('\\n');
  
  if (!styleEl.parentNode) {
    document.head.appendChild(styleEl);
  }
}`;

const setStylesScript = `function setStyles(styleChunks, themeName) {
  // Initialize style collector if needed
  if (!window.__collectedStyles) {
    window.__collectedStyles = {
      styles: new Map(),
    };
  }

  styleChunks.forEach(style => {
    window.__collectedStyles.styles.set(style.name, style);
  });

  // Apply all styles (this will re-sort and update the stylesheet)
  applyStyles(themeName);
}`;

interface StyleChunk {
  name: string
  priority: number
  cssRules: string
}

function getStylesForTheme(mountedStyles: StylesContextType['mountedStyles'], theme: ThemeType) {
  const _jss = getJss();
  const styleChunks: StyleChunk[] = [];
  
  for (const [name, { styleDefinition }] of mountedStyles) {
    const styles = styleDefinition.styles(theme);

    const sheet = _jss.createStyleSheet(styles, {
      generateId: (rule) => {
        if (rule.type === 'keyframes') {
          return (rule as AnyBecauseHard).name
        }
        return `${name}-${rule.key}`
      },
    });

    styleChunks.push({
      name,
      priority: styleDefinition.options?.stylePriority ?? 0,
      cssRules: sheet.toString()
    });
  }

  return styleChunks;
}

export default function StyleRegistry({
  themeOptions,
  children,
}: {
  themeOptions: ThemeOptions
  children: React.ReactNode
}) {
  const theme = getForumTheme(themeOptions);
  
  // Track which styles have already been sent to client
  const [injectedStyles] = useState(() => new Set<string>());
  const chunkCountRef = useRef(0);

  /** One context object per request */
  const [stylesContext] = useState<StylesContextType>(() => ({
    theme,
    mountedStyles: new Map(),
  }));

  /* Inject the CSS before the HTML that needs it */
  useServerInsertedHTML(() => {
    // Only inject styles that haven't been injected yet
    const stylesToInject: StylesContextType['mountedStyles'] = new Map()
    
    for (const [name, value] of stylesContext.mountedStyles) {
      if (!injectedStyles.has(name)) {
        stylesToInject.set(name, value)
        injectedStyles.add(name)
      }
    }
    
    if (stylesToInject.size === 0) {
      return null
    }

    const chunkId = ++chunkCountRef.current;
    
    // Generate CSS for each style individually so we can sort them later
    const styleChunks: StyleChunk[] = [];

    if (chunkId === 1) {
      styleChunks.push({
        name: 'miscStyles',
        priority: 0,
        cssRules: miscStyles()
      }, {
        name: 'cssVars',
        priority: 0,
        cssRules: requestedCssVarsToString(theme)
      });

      styleChunks.push(...theme.rawCSS.map(css => ({
        name: 'rawCSS',
        priority: 0,
        cssRules: css
      })));
    }

    styleChunks.push(...getStylesForTheme(stylesToInject, theme));

    // Serialize the style data
    const serializedChunks = JSON.stringify(styleChunks);

    const setStyles = `setStyles(${serializedChunks}, '${theme.themeOptions.name}');`

    return (
      <script
        dangerouslySetInnerHTML={{
          // Only send the scripts once, with the first chunk
          __html: chunkId === 1
            ? applyStylesScript + setStylesScript + setStyles
            : setStyles
        }}
      />
    );
  })

  /* Expose the context to every component that calls useStyles() */
  if (typeof window !== 'undefined') {
    setClientMountedStyles(stylesContext);
  }

  return (
    <StylesContext.Provider value={stylesContext}>
      {children}
    </StylesContext.Provider>
  )
}
