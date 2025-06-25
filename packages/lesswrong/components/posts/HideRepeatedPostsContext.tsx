import React, { createContext, useContext, useRef, useState } from "react";

/**
 * HideRepeatedPostsProvider and HideIfRepeated are a context provider and
 * consumer for suppressing duplicate posts, in the case where you have several
 * posts lists in a row (eg when you have a post list for curated immediately
 * followed by a posts list for recent). To do it, wrap all the post lists in
 * <HideRepeatedPostsProvider>, then wrap each individual post item in
 * <HideIfRepeated precedence={...} postId={...}>. If two or more post items
 * wrapped this way have the same postId, then only post items with the lowest
 * precedence will be visible.
 *
 * The implementation of this is subtle, because the post items could render in
 * any order (due to react async rendering and suspense boundaries), and this
 * needs to work during SSR, which means useEffect/setState won't work.
 *
 * To do this, each <HideIfRepeated> wraps its contents in a span with a unique
 * classname, post_<id>_<precedence>. On render, it records its postId and
 * precedence in the context. If it finds a previously rendered post item with
 * the same ID, it compares precedence, and emits a <style> tag to hide either
 * itself, or the previously-rendered post item.
 */

type HideRepeatedPostsContextType = {
  precedencesSeenByPostId: Record<string, number[]>
}
const HideRepeatedPostsContext = createContext<HideRepeatedPostsContextType|null>(null);

export const HideRepeatedPostsProvider = ({children}: {
  children: React.ReactNode
}) => {
  const context = useRef({ precedencesSeenByPostId: {} });
  return <HideRepeatedPostsContext.Provider value={context.current}>
    {children}
  </HideRepeatedPostsContext.Provider>
}

export const HideIfRepeated = ({ precedence, postId, children }: {
  precedence?: number
  postId: string
  children: React.ReactNode
}) => {
  const context = useContext(HideRepeatedPostsContext);
  const [hidePrecedences] = useState((): number[] => {
    if (!precedence) return [];
    if (!context) return [];
    const previouslySeen = context.precedencesSeenByPostId[postId];
    if (!previouslySeen) {
      context.precedencesSeenByPostId[postId] = [precedence];
      return [];
    } else if (previouslySeen.some(p => p < precedence)) {
      // A previously-seen post item has the same post ID and takes precedence;
      // hide this one.
      context.precedencesSeenByPostId[postId].push(precedence);
      return [precedence];
    } else if (previouslySeen.includes(precedence)) {
      // Already seen at the same precedence level - neither gets hidden
      return [];
    } else {
      context.precedencesSeenByPostId[postId].push(precedence);
      return previouslySeen.filter(p => p > precedence);
    }
  });
  
  return <span className={`post_${postId}_${precedence}`}>
    {children}
    
    <style suppressHydrationWarning>
      {hidePrecedences.map(p => `.post_${postId}_${p} { display: none }`).join("\n")}
    </style>
  </span>
}
