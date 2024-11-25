import { createContext, useContext } from "react";

type PostsPageContextPayload = {
  fullPost: PostsWithNavigation|PostsWithNavigationAndRevision|PostsPage|null
  postPreload: PostsListWithVotes|null
}

export const PostsPageContext = createContext<PostsPageContextPayload|null>(null);

export const usePostsPageContext = () => useContext(PostsPageContext);
