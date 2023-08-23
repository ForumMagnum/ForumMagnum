import React, { FC } from "react";
import FullScreenScrollView from "../components/FullScreenScrollView";
import PostsList from "../components/PostsList";

const HomeScreen: FC = () => {
  return (
    <FullScreenScrollView>
      <PostsList />
    </FullScreenScrollView>
  );
}

export default HomeScreen;
