import React, { ComponentType, useRef } from "react";
import { Link } from "./reactRouterWrapper";
import { useRecommendations } from "../components/recommendations/withRecommendations";
import { useSsrRenderedAt } from "./utils/timeUtil";
import { postGetPrimaryTag } from "./collections/posts/helpers";
import { HIDE_MORE_FROM_THE_FORUM_RECOMMENDATIONS_COOKIE } from "./cookies/cookies";
import { useCookiesWithConsent, Cookies } from "../components/hooks/useCookiesWithConsent";
import type {
  RecommendationsAlgorithmWithStrategy,
  StrategySpecification,
} from "./collections/users/recommendationSettings";
import { Components } from "./vulcan-lib/components";

type RecommendablePost = PostsWithNavigation|PostsWithNavigationAndRevision;

/**
 * The content to be displayed as recommendations at the side of posts is
 * generated in the following format, which allows easily switching between
 * different algorithms and configurations. To add a new algorithm, simply
 * create a React hook function of type `RecommendationsGenerator` and add
 * it to the array of generators returned by `getAvailableGenerators`.
 */
export type PostSideRecommendations = {
  /** If recommendations are still loading */
  loading: boolean,
  /** Title for the section (generally the algorithm name) */
  title: string,
  /** The container type to place the results in (defaults to "div") */
  Container?: "div" | "ol" | "ul",
  /** List of recommendations to display - may be empty if loading */
  items: ComponentType[],
  /** An optional cookie name to handle hiding the section - if undefined
   *  the section is not hideable */
  hideCookieName?: string,
}

/**
 * Recommendations generators are used as hooks, so the name should begin
 * with "use".
 */
type RecommendationsGenerator = (post: RecommendablePost) => PostSideRecommendations;

const useMoreFromTheForumRecommendations: RecommendationsGenerator = (
  _post: RecommendablePost,
) => {
  const usefulLinks = "/posts/BsnGqnLzrLdmsYTGt/new-start-here-useful-links-1";
  const podcast = "/posts/K5Snxo5EhgmwJJjR2/announcing-ea-forum-podcast-audio-narrations-of-ea-forum";
  const digest = "https://effectivealtruism.us8.list-manage.com/subscribe?u=52b028e7f799cca137ef74763&id=7457c7ff3e";
  const jobs = "/topics/opportunities-to-take-action";
  return {
    loading: false,
    title: "More from the Forum",
    Container: "ul",
    items: [
      () => <li>
        New? <Link to={usefulLinks}>Expore useful links</Link>
      </li>,
      () => <li>
        <Link to={podcast}>Listen</Link> to popular & recent posts
      </li>,
      () => <li>
        Get weekly highlights in your inbox: Sign up for the{" "}
        <Link to={digest}>EA Forum Digest</Link>
      </li>,
      () => <li>
        Browse <Link to={jobs}>job opportunities</Link>
      </li>,
    ],
    hideCookieName: HIDE_MORE_FROM_THE_FORUM_RECOMMENDATIONS_COOKIE,
  };
}

const useGeneratorWithStrategy = (
  title: string,
  strategy: StrategySpecification,
): PostSideRecommendations => {
  const algorithm: RecommendationsAlgorithmWithStrategy = {
    strategy: {
      context: "post-right",
      ...strategy,
    },
    count: 3,
    disableFallbacks: true,
  };
  const {
    recommendations: posts = [],
    recommendationsLoading: loading,
  } = useRecommendations({ algorithm });
  return {
    loading,
    title,
    items: posts.map((post) => () => <Components.SideRecommendation post={post} />),
  };
}

const useMorePostsListThisRecommendations: RecommendationsGenerator = (
  post: RecommendablePost,
) =>
  useGeneratorWithStrategy("More posts like this", {
    name: "tagWeightedCollabFilter",
    postId: post._id,
  });

const useNewAndUpvotedInTagRecommendations: RecommendationsGenerator = (
  post: RecommendablePost,
) => {
  const tag = postGetPrimaryTag(post, true);
  if (!tag) {
    throw new Error("Couldn't choose recommendation tag");
  }
  return useGeneratorWithStrategy(`More in ${tag.name}`, {
    name: "newAndUpvotedInTag",
    postId: post._id,
    tagId: tag._id,
  });
}

const getAvailableGenerators = (
  user: UsersCurrent|null,
  post: RecommendablePost,
  cookies: Cookies,
): RecommendationsGenerator[] => {
  const generators: RecommendationsGenerator[] = [
    useMorePostsListThisRecommendations.bind(null, post),
  ];
  if (post.tags.length) {
    generators.push(useNewAndUpvotedInTagRecommendations.bind(null, post));
  }
  if (!user && cookies[HIDE_MORE_FROM_THE_FORUM_RECOMMENDATIONS_COOKIE] !== "true") {
    // Temporarily disabled
    // generators.push(useMoreFromTheForumRecommendations);
  }
  return generators;
}

const useGenerator = (
  seed: number,
  user: UsersCurrent|null,
  post: RecommendablePost,
): RecommendationsGenerator => {
  const [cookies] = useCookiesWithConsent();
  const generator = useRef<RecommendationsGenerator>(null);
  if (!generator.current) {
    const generators = getAvailableGenerators(user, post, cookies);
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
