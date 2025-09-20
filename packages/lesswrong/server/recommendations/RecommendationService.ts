import {
  StrategySpecification,
  RecommendationStrategyName,
} from "../../lib/collections/users/recommendationSettings";
import MoreFromAuthorStrategy from "./MoreFromAuthorStrategy";
import MoreFromTagStrategy from "./MoreFromTagStrategy";
import BestOfStrategy from "./BestOfStrategy";
import WrappedStrategy from "./WrappedStrategy";
import CollabFilterStrategy from "./CollabFilterStrategy";
import TagWeightedCollabFilterStrategy from "./TagWeightedCollabFilter";
import RecommendationStrategy, { RecommendationResult } from "./RecommendationStrategy";
import PostRecommendationsRepo from "../repos/PostRecommendationsRepo";
import { loggerConstructor } from "../../lib/utils/logging";
import FeatureStrategy from "./FeatureStrategy";
import NewAndUpvotedInTagStrategy from "./NewAndUpvotedInTagStrategy";
import { backgroundTask } from "../utils/backgroundTask";

type ConstructableStrategy = {
  new(): RecommendationStrategy,
}

/**
 * The `RecommendationService` is the external interface to the recommendation system.
 *
 * New algorithms should be implemented by extending the `RecommendationStrategy`
 * abstract class.
 */
class RecommendationService {
  constructor(
    private logger = loggerConstructor("recommendation-service"),
    private repo = new PostRecommendationsRepo(),
  ) {}

  private strategies: Record<RecommendationStrategyName, ConstructableStrategy> = {
    newAndUpvotedInTag: NewAndUpvotedInTagStrategy,
    moreFromTag: MoreFromTagStrategy,
    moreFromAuthor: MoreFromAuthorStrategy,
    bestOf: BestOfStrategy,
    wrapped: WrappedStrategy,
    tagWeightedCollabFilter: TagWeightedCollabFilterStrategy,
    collabFilter: CollabFilterStrategy,
    feature: FeatureStrategy,
  };

  async recommend(
    currentUser: DbUser|null,
    clientId: string|null,
    count: number,
    strategy: StrategySpecification,
    disableFallbacks = false,
  ): Promise<DbPost[]> {
    if (strategy.forceLoggedOutView) {
      currentUser = null;
    }

    const strategies = this.getStrategyStack(strategy.name, disableFallbacks);
    let posts: DbPost[] = [];

    while (count > 0 && strategies.length) {
      this.logger("Recommending for", strategy.postId, "with", strategies[0]);
      const start = Date.now();
      const result = await this.recommendWithStrategyName(
        currentUser,
        count,
        strategy,
        strategies[0],
      );
      const newPosts = result.posts.filter(
        ({_id}) => !posts.some((post) => post._id === _id),
      );
      const time = Date.now() - start;
      this.logger("...found", newPosts.length, "posts in", time, "milliseconds");

      backgroundTask(this.repo.recordRecommendations(
        currentUser,
        clientId,
        strategies[0],
        {...result.settings, context: strategy.context},
        newPosts,
      ));

      posts = posts.concat(newPosts);
      count -= newPosts.length;

      strategies.shift();
    }

    return posts;
  }

  private getStrategyStack(
    primaryStrategy: RecommendationStrategyName,
    disableFallbacks = false,
  ): RecommendationStrategyName[] {
    if (disableFallbacks) {
      return [primaryStrategy];
    }
    const strategies = Object.keys(this.strategies) as RecommendationStrategyName[];
    return [
      primaryStrategy,
      ...strategies.filter((s) => s !== primaryStrategy),
    ];
  }

  private async recommendWithStrategyName(
    currentUser: DbUser|null,
    count: number,
    strategy: StrategySpecification,
    strategyName: RecommendationStrategyName,
  ): Promise<RecommendationResult> {
    const Provider = this.strategies[strategyName];
    if (!Provider) {
      throw new Error("Invalid recommendation strategy name: " + strategyName);
    }
    const source = new Provider();
    try {
      return await source.recommend(currentUser, count, strategy);
    } catch (e) {
      this.logger("Recommendation error:", e.message);
      const settings = {
        postId: strategy.postId,
        bias: strategy.bias,
        features: strategy.features,
      };
      return {posts: [], settings};
    }
  }

  async markRecommendationAsObserved(
    currentUser: DbUser|null,
    clientId: string|null,
    postId: string,
  ): Promise<void> {
    const userId = currentUser?._id ?? null;
    this.logger("Marking recommendation as observed:", {userId, clientId, postId});
    await this.repo.markRecommendationAsObserved(userId, clientId, postId);
  }

  async markRecommendationAsClicked(
    currentUser: DbUser|null,
    clientId: string|null,
    postId: string,
  ): Promise<void> {
    const userId = currentUser?._id ?? null;
    this.logger("Marking recommendation as clicked:", {userId, clientId, postId});
    await this.repo.markRecommendationAsClicked(userId, clientId, postId);
  }
}

export default RecommendationService;
