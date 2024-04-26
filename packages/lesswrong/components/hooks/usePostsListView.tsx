import React, { FC, ReactNode, createContext, useCallback, useContext, useState } from "react";
import { TupleSet, UnionOf } from "../../lib/utils/typeGuardUtils";
import { useCookiesWithConsent } from "./useCookiesWithConsent";
import { POSTS_LIST_VIEW_TYPE_COOKIE } from "../../lib/cookies/cookies";

const postsListViewTypes = new TupleSet(["list", "card"] as const);

export type PostsListViewType = UnionOf<typeof postsListViewTypes>;

export const isPostsListViewType = (value: string): value is PostsListViewType =>
  postsListViewTypes.has(value);

type PostsListViewContext = {
  view: PostsListViewType,
  setView: (view: PostsListViewType) => void,
}

const postsListViewContext = createContext<PostsListViewContext>({
  view: "list",
  // eslint-disable-next-line
  setView: () => console.error("Can't set view outside of PostsListViewProvider"),
});

const useCookieValue = (): {
  cookieValue: PostsListViewType | null,
    setCookieValue: (value: PostsListViewType) => void,
} => {
  const [cookies, setCookie] = useCookiesWithConsent([POSTS_LIST_VIEW_TYPE_COOKIE]);
  const value = cookies[POSTS_LIST_VIEW_TYPE_COOKIE];
  const setCookieValue = useCallback((newValue: PostsListViewType) => {
    setCookie(POSTS_LIST_VIEW_TYPE_COOKIE, newValue);
  }, [setCookie]);
  return {
    cookieValue: isPostsListViewType(value) ? value : null,
    setCookieValue,
  };
}

export const PostsListViewProvider: FC<{children: ReactNode}> = ({children}) => {
  const {cookieValue, setCookieValue} = useCookieValue();
  const [view, setView_] = useState<PostsListViewType>(cookieValue ?? "list");

  const setView = useCallback((newValue: PostsListViewType) => {
    setView_(newValue);
    setCookieValue(newValue);
  }, [setCookieValue]);

  return (
    <postsListViewContext.Provider value={{view, setView}}>
      {children}
    </postsListViewContext.Provider>
  );
}

export const usePostsListView = () => useContext(postsListViewContext);
