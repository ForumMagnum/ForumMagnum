import { createContext, useContext } from "react";

type PostsPageContextPayload = PostsWithNavigation|PostsWithNavigationAndRevision|null;

export const PostsPageContext = createContext<PostsPageContextPayload>(null);

export const usePostsPageContext = () => useContext(PostsPageContext);
