import React, { ComponentType, FC, useRef } from "react";
import { Link } from "./reactRouterWrapper";
import { useRecommendations } from "../components/recommendations/withRecommendations";
import { useSsrRenderedAt } from "./utils/timeUtil";
import type {
  RecommendationsAlgorithmWithStrategy,
  StrategySpecification,
} from "./collections/users/recommendationSettings";
import { userGetDisplayName } from "./collections/users/helpers";
import { postGetLink, postGetPrimaryTag } from "./collections/posts/helpers";

type RecommendablePost = PostsWithNavigation|PostsWithNavigationAndRevision;

export type PostSideRecommendations = {
  loading: boolean,
  title: string,
  numbered: boolean,
  items: ComponentType[],
}

type RecommendationsGenerator = (post: RecommendablePost) => PostSideRecommendations;

const useMoreFromTheForumRecommendations = (_post: RecommendablePost) => {
  // TODO: Add the correct link URLs
  const usefulLinks = "#";
  const podcast = "#";
  const digest = "#";
  const jobs = "#";
  return {
    loading: false,
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

const LiPostRecommendation: FC<{
  post: PostsListWithVotesAndSequence,
}> = ({post}) => {
  const url = postGetLink(post);
  const author = userGetDisplayName(post.user);
  const readTimeMinutes = Math.max(post.readTimeMinutes, 1);
  const mins = readTimeMinutes === 1 ? "1 min" : `${readTimeMinutes} mins`;
  return (
    <li>
      <Link to={url}>{post.title}</Link> ({author}, {mins})
    </li>
  );
}

const useGeneratorWithStrategy = (
  title: string,
  strategy: StrategySpecification,
) => {
  const algorithm: RecommendationsAlgorithmWithStrategy = {
    strategy,
    count: 3,
  };
  const {
    recommendations: posts = [],
    recommendationsLoading: loading,
  } = useRecommendations(algorithm);
  return {
    loading,
    title,
    numbered: true,
    items: posts.map((post) => () => <LiPostRecommendation post={post} />),
  };
}

const useMorePostsListThisRecommendations = (post: RecommendablePost) =>
  useGeneratorWithStrategy("More posts like this", {
    name: "tagWeightedCollabFilter",
    postId: post._id,
  });

const useNewAndUpvotedInTagRecommendations = (post: RecommendablePost) => {
  const tag = postGetPrimaryTag(post, true);
  if (!tag) {
    throw new Error("Couldn't choose recommendation tag");
  }
  return useGeneratorWithStrategy(`New & upvoted in ${tag.name}`, {
    name: "newAndUpvotedInTag",
    postId: post._id,
    tagId: tag._id,
  });
}

const useGenerator = (
  seed: number,
  user: UsersCurrent|null,
  post: RecommendablePost,
) => {
  const generator = useRef<RecommendationsGenerator>();
  if (!generator.current) {
    const generators: RecommendationsGenerator[] = [
      useMorePostsListThisRecommendations.bind(null, post),
    ];
    if (post.tags.length) {
      generators.push(useNewAndUpvotedInTagRecommendations.bind(null, post));
    }
    if (!user) {
      generators.push(useMoreFromTheForumRecommendations);
    }
    const index = Math.floor(seed) % generators.length;
    generator.current = generators[index];
  }
  return generator.current;
}

export const usePostSideRecommendations = (
  user: UsersCurrent|null,
  post: RecommendablePost,
): PostSideRecommendations => {
  const ssrRenderedAt = useSsrRenderedAt().getTime();
  const useRecommendations = useGenerator(ssrRenderedAt, user, post);
  return useRecommendations(post);
}
