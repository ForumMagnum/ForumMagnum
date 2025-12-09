import entries from "lodash/fp/entries";
import sortBy from "lodash/sortBy";
import last from "lodash/fp/last";
import sum from "lodash/sum";
import pick from "lodash/pick";
import maxBy from "lodash/maxBy";
import toPairs from "lodash/toPairs";

const relevantTags = {
  "animal-welfare": "Animal Welfarist",
  "philosophy": "Philosopher",
  "building-effective-altruism": "EA Builder",
  "biosecurity": "Biosecuritarian",
  "pandemic-preparedness": "Biosecuritarian",
  "global-health-and-development": "Global Healther",
  "ai-safety": "AI Safetyist",
} as const;

type RelevantTagSlug = keyof typeof relevantTags;

export class WrappedPersonality {
  private parts: string[] = [];

  constructor({
    reactsReceived,
    reactsGiven,
    agreements,
    engagementPercentile,
    totalKarmaChange,
    postsFirstCommented,
    joinedAt,
    upvotedPostsTagRelevance,
  }: {
    reactsReceived: Record<string, number>,
    reactsGiven: Record<string, number>,
    agreements: Record<"agree" | "disagree", number>,
    engagementPercentile: number,
    totalKarmaChange: number,
    postsFirstCommented: number,
    joinedAt: Date,
    upvotedPostsTagRelevance: Record<string, number>,
  }) {
    // Choose the first adjective based on reacts
    const totalReactsReceived = sum(Object.values(reactsReceived));
    const totalReactsGiven = sum(Object.values(reactsReceived));
    if (totalReactsReceived === 0 && totalReactsGiven === 0) {
      if (agreements.agree && agreements.agree > agreements.disagree) {
        this.parts.push("Agreeable");
      } else {
        this.parts.push("Stoic");
      }
    } else if (totalReactsReceived < totalReactsGiven) {
      switch (last(sortBy(entries(reactsGiven), last))?.[0]) {
        case "love":         this.parts.push("Loving");      break;
        case "helpful":      this.parts.push("Grateful");    break;
        case "insightful":   this.parts.push("Curious");     break;
        case "changed-mind": this.parts.push("Open-Minded"); break;
      }
    } else {
      switch (last(sortBy(entries(reactsReceived), last))?.[0]) {
        case "love":         this.parts.push("Beloved");     break;
        case "helpful":      this.parts.push("Helpful");     break;
        case "insightful":   this.parts.push("Insightful");  break;
        case "changed-mind": this.parts.push("Influential"); break;
      }
    }

    // Choose the second adjective based on engagement
    if (engagementPercentile >= 0.75) {
      this.parts.push("Online");
    } else if (engagementPercentile >= 0.25) {
      this.parts.push("Measured");
    } else {
      this.parts.push("Occasional");
    }

    // Choose the noun
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(new Date().getMonth() - 1);
    if (totalKarmaChange >= 1000) {
      this.parts.push("Karma Charmer");
    } else if (postsFirstCommented > 1) {
      this.parts.push("First Responder");
    } else if (joinedAt >= oneMonthAgo) {
      this.parts.push("Newbie");
    } else {
      const tags = pick(
        upvotedPostsTagRelevance,
        Object.keys(relevantTags),
      ) as Record<RelevantTagSlug, number>;
      const bestTag = maxBy(
        toPairs(tags),
        (tag) => tag[1],
      )?.[0] as RelevantTagSlug | undefined;
      this.parts.push(bestTag ? relevantTags[bestTag] : "Newbie");
    }
  }

  toString() {
    return this.parts.join(" ");
  }
}
