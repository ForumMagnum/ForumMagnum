import React, { ComponentType, useEffect, useRef, useState } from "react";
import { Link } from "./reactRouterWrapper";
import rng from "./seedrandom";

type RecommendablePost = PostsWithNavigation|PostsWithNavigationAndRevision;

export type PostSideRecommendations = {
  title: string,
  numbered: boolean,
  items: ComponentType[],
}

const moreFromTheForumRecommendations = (): PostSideRecommendations => {
  // TODO: Add the correct link URLs
  const usefulLinks = "#";
  const podcast = "#";
  const digest = "#";
  const jobs = "#";
  return {
    title: "More from the Forum",
    numbered: false,
    items: [
      () => <li>
        New to the forum? <Link to={usefulLinks}>Useful links here</Link>
      </li>,
      () => <li>
        Listen to posts on our <Link to={podcast}>podcast</Link>
      </li>,
      () => <li>
        Sign up for the <Link to={digest}>EA Forum Digest</Link> to get
        curated recommendations
      </li>,
      () => <li>
        Browse <Link to={jobs}>job opportunities</Link>
      </li>,
    ],
  };
}

const morePostsListThisRecommendations = (
  post: RecommendablePost,
): PostSideRecommendations => {
  return {
    title: "More posts like this",
    numbered: true,
    items: [
      // TODO
    ],
  };
}

const newAndUpvotedInTagRecommendations = (
  post: RecommendablePost,
): PostSideRecommendations => {
  const tagName = "TODO";
  return {
    title: `New & upvoted in ${tagName}`,
    numbered: true,
    items: [
      // TODO
    ],
  };
}

const getPostSideRecommendations = (
  seed: string,
  user: UsersCurrent|null,
  post: RecommendablePost,
): PostSideRecommendations => {
  const generators = [
    morePostsListThisRecommendations.bind(null, post),
    newAndUpvotedInTagRecommendations.bind(null, post),
  ];
  if (!user) {
    generators.push(moreFromTheForumRecommendations);
  }
  const rand = rng(seed);
  const index = Math.abs(rand.int32()) % generators.length;
  return generators[index]();
}

/**
 * Generate recommendations for displaying at the side of a post
 * Note that this is _not_ SSR safe and should only be used inside NoSSR
 */
export const usePostSideRecommendations = (
  user: UsersCurrent|null,
  post: RecommendablePost,
): PostSideRecommendations|null => {
  const seed = useRef(String(Date.now()));
  const [
    recommendations,
    setRecommendations,
  ] = useState<PostSideRecommendations|null>(null);
  useEffect(() => {
    setRecommendations(getPostSideRecommendations(seed.current, user, post));
  }, [user, post, seed]);
  return recommendations;
}
