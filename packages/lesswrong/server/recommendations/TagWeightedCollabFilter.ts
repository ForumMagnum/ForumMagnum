import CollabFilterStrategy from "./CollabFilterStrategy";

/**
 * This strategy is the same as the collaborative filter strategy, but it also
 * considers the similarity of the post tags when choosing results.
 */
class TagWeightedCollabFilterStrategy extends CollabFilterStrategy {
  constructor() {
    super();
    this.weightByTagSimilarity = true;
  }
}

export default TagWeightedCollabFilterStrategy;
