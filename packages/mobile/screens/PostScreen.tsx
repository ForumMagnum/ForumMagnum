import React, { FC } from "react";
import { useSingle } from "../hooks/useSingle";
import FullScreenScrollView from "../components/FullScreenScrollView";
import Loader from "../components/Loader";
import PostDisplay from "../components/PostDisplay";

const PostScreen: FC = () => {
  const {result, loading} = useSingle();
  return (
    <FullScreenScrollView>
      {loading ? <Loader /> : <PostDisplay post={result} />}
    </FullScreenScrollView>
  );
}

export default PostScreen;
