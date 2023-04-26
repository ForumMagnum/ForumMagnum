import {
  StrategySpecification,
  RecommendationStrategyName,
} from "../../lib/collections/users/recommendationSettings";
import MoreFromAuthorStrategy from "./MoreFromAuthorStrategy";
import MoreFromTagStrategy from "./MoreFromTagStrategy";
import BestOfStrategy from "./BestOfStrategy";
import CollabFilterStrategy from "./CollabFilterStrategy";
import TagWeightedCollabFilterStrategy from "./TagWeightedCollabFilter";
import RecommendationStrategy from "./RecommendationStrategy";
import PostRecommendationsRepo from "../repos/PostRecommendationsRepo";
import { loggerConstructor } from "../../lib/utils/logging";
import FeatureStrategy from "./FeatureStrategy";

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
    moreFromTag: MoreFromTagStrategy,
    moreFromAuthor: MoreFromAuthorStrategy,
    bestOf: BestOfStrategy,
    tagWeightedCollabFilter: TagWeightedCollabFilterStrategy,
    collabFilter: CollabFilterStrategy,
    feature: FeatureStrategy,
  };

  async recommend(
    currentUser: DbUser|null,
    count: number,
    strategy: StrategySpecification,
  ): Promise<DbPost[]> {
    if (strategy.forceLoggedOutView) {
      currentUser = null;
    }

    const strategies = this.getStrategyStack(strategy.name);
    let posts: DbPost[] = [];

    while (count > 0 && strategies.length) {
      this.logger("Recommending for", strategy.postId, "with", strategies[0]);
      const start = Date.now();
      const newPosts = (await this.recommendWithStrategyName(
        currentUser,
        count,
        strategy,
        strategies[0],
      )).filter(
        ({_id}) => !posts.some((post) => post._id === _id),
      );
      const time = Date.now() - start;
      this.logger("...found", newPosts.length, "posts in", time, "milliseconds");

      if (currentUser) {
        void this.repo.recordRecommendations(currentUser, strategies[0], newPosts);
      }

      posts = posts.concat(newPosts);
      count -= newPosts.length;

      strategies.shift();
    }

    return posts;
  }

  private getStrategyStack(
    primaryStrategy: RecommendationStrategyName,
  ): RecommendationStrategyName[] {
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
  ): Promise<DbPost[]> {
    const Provider = this.strategies[strategyName];
    if (!Provider) {
      throw new Error("Invalid recommendation strategy name: " + strategyName);
    }
    const source = new Provider();
    try {
      return await source.recommend(currentUser, count, strategy);
    } catch (e) {
      this.logger("Recommendation error:", e.message);
      return [];
    }
  }

  async markRecommendationAsObserved(
    {_id: userId}: DbUser,
    postId: string,
  ): Promise<void> {
    this.logger("Marking recommendation as observed:", {userId, postId});
    await this.repo.markRecommendationAsObserved(userId, postId);
  }

  async markRecommendationAsClicked(
    {_id: userId}: DbUser,
    postId: string,
  ): Promise<void> {
    this.logger("Marking recommendation as clicked:", {userId, postId});
    await this.repo.markRecommendationAsClicked(userId, postId);
  }
}

export default RecommendationService;
