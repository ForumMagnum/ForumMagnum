import React, { FC } from "react";
import { useMulti } from "../hooks/useMulti";
import { postSchema } from "../types/PostTypes";
import FullScreenScrollView from "../components/FullScreenScrollView";
import PostsList from "../components/PostsList";
import Loader from "../components/Loader";

const HomeScreen: FC = () => {
  const {results, loading, loadingInitial, refetch} = useMulti({
    terms: {
      view: "magic",
      limit: 20,
      meta: null,
      forum: true,
    },
    schema: postSchema,
  });
  return (
    <FullScreenScrollView
      refreshing={loading && !loadingInitial}
      onRefresh={refetch}
    >
      {loadingInitial || !results
        ? <Loader />
        : <PostsList posts={results} />
      }
    </FullScreenScrollView>
  );
}

export default HomeScreen;
