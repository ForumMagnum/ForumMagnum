import React, { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { useForumType } from '@/components/hooks/useForumType';
import { IsRecommendationContext } from '../dropdowns/posts/PostActions';

export type PostIndicator = "recommended" | "curated" | "personalBlog" | "alignmentForum";

export const postIndicatorLabels: Array<{indicator: PostIndicator, label: string}> = [
  {indicator: "recommended", label: "Recommended"},
  {indicator: "curated", label: "Curated"},
  {indicator: "personalBlog", label: "Personal Blog"},
  {indicator: "alignmentForum", label: "Alignment Forum"},
];

export const usePostIndicators = (post: PostsBase): Record<PostIndicator, boolean> => {
  const { isAF } = useForumType();
  const isRecommendation = useContext(IsRecommendationContext);

  return {
    recommended: isRecommendation,
    curated: !!post.curatedDate,
    personalBlog: !post.frontpageDate && !post.isEvent && !post.draft,
    alignmentForum: !isAF && post.af,
  };
};

interface PostIndicatorHighlight {
  highlightedIndicator: PostIndicator|null,
  setHighlightedIndicator: (indicator: PostIndicator|null) => void,
}

export const PostIndicatorHighlightContext = createContext<PostIndicatorHighlight>({
  highlightedIndicator: null,
  setHighlightedIndicator: () => {},
});

export const PostIndicatorHighlightProvider = ({children}: {children: ReactNode}) => {
  const [highlightedIndicator, setHighlightedIndicator] = useState<PostIndicator|null>(null);
  const highlight = useMemo(() => ({highlightedIndicator, setHighlightedIndicator}), [highlightedIndicator]);

  return <PostIndicatorHighlightContext.Provider value={highlight}>
    {children}
  </PostIndicatorHighlightContext.Provider>;
};
