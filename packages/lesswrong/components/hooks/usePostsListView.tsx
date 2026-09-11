import type { ForumTypeString } from '@/lib/instanceSettings';
import { useForumType } from '@/components/hooks/useForumType';
import React, { FC, ReactNode, createContext, useCallback, useContext, useState } from "react";
import { TupleSet, UnionOf } from "../../lib/utils/typeGuardUtils";
import { useCookiesWithConsent } from "./useCookiesWithConsent";
import { POSTS_LIST_VIEW_TYPE_COOKIE } from "../../lib/cookies/cookies";
import { useCurrentUser } from "../common/withUser";
import { postsListViewTypeSetting } from '@/lib/instanceSettings';

const postsListViewTypes = new TupleSet(["list", "card"] as const);

export type PostsListViewType = UnionOf<typeof postsListViewTypes>;

export const isPostsListViewType = (value: string): value is PostsListViewType =>
  postsListViewTypes.has(value);

type PostsListViewContext = {
  getView: () => PostsListViewType,
  setView: (view: PostsListViewType) => void,
}

const getDefaultView = (forumType: ForumTypeString): PostsListViewType => {
  const defaultViewSetting = postsListViewTypeSetting.get(forumType)
  return isPostsListViewType(defaultViewSetting) ? defaultViewSetting : 'list'
}

const postsListViewContext = createContext<PostsListViewContext | null>(null);

function setViewWithoutProvider() {
  // eslint-disable-next-line no-console
  console.error("Can't set view outside of PostsListViewProvider");
}

const useCookieValue = (): {
  cookieValue: PostsListViewType | null,
    setCookieValue: (value: PostsListViewType) => void,
} => {
  const { forumType } = useForumType();
  const currentUser = useCurrentUser();
  const [cookies, setCookie] = useCookiesWithConsent([POSTS_LIST_VIEW_TYPE_COOKIE]);
  const setCookieValue = useCallback((newValue: PostsListViewType) => {
    setCookie(POSTS_LIST_VIEW_TYPE_COOKIE, newValue, {path: "/"});
  }, [setCookie]);

  // TODO: We currently need to disable persisting the card view for logged out
  // users because it plays really badly with the page cache
  const value = currentUser ? cookies[POSTS_LIST_VIEW_TYPE_COOKIE] : getDefaultView(forumType);
  return {
    cookieValue: isPostsListViewType(value) ? value : null,
    setCookieValue,
  };
}

export const PostsListViewProvider: FC<{children: ReactNode}> = ({children}) => {
  const { forumType } = useForumType();
  const {cookieValue, setCookieValue} = useCookieValue();
  const [view, setView_] = useState<PostsListViewType>(cookieValue ?? getDefaultView(forumType));

  const getView = useCallback(() => view, [view]);

  const setView = useCallback((newValue: PostsListViewType) => {
    setView_(newValue);
    setCookieValue(newValue);
  }, [setCookieValue]);

  return (
    <postsListViewContext.Provider value={{getView, setView}}>
      {children}
    </postsListViewContext.Provider>
  );
}

export const usePostsListView = (): PostsListViewContext => {
  const context = useContext(postsListViewContext);
  const { forumType } = useForumType();
  const getDefault = useCallback(() => getDefaultView(forumType), [forumType]);
  return context ?? {getView: getDefault, setView: setViewWithoutProvider};
};
