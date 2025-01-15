import entries from "lodash/fp/entries";
import sortBy from "lodash/sortBy";
import last from "lodash/fp/last";
import sum from "lodash/sum";

export class WrappedPersonality {
  private parts: string[] = [];

  constructor({
    reactsReceived,
    reactsGiven,
    agreements,
    engagementPercentile,
    totalKarmaChange,
    postsWritten,
    commentsWritten,
    topPost,
    topComment,
    discussionsStarted,
  }: {
    reactsReceived: Record<string, number>,
    reactsGiven: Record<string, number>,
    agreements: Record<"agree" | "disagree", number>,
    engagementPercentile: number,
    totalKarmaChange: number,
    postsWritten: number,
    commentsWritten: number,
    topPost: DbPost | null,
    topComment: DbComment | null,
    discussionsStarted: number,
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
    if (totalKarmaChange >= 500) {
      this.parts.push("Karma Farmer");
    } else if (discussionsStarted >= 3) {
      this.parts.push("Conversation Starter");
    } else if (
      agreements.disagree &&
      agreements.disagree >= agreements.agree * 2
    ) {
      this.parts.push("Contrarian");
    } else if (
      totalKarmaChange > 0 &&
      (
        (topPost?.baseScore ?? 0) >= 0.75 * totalKarmaChange ||
        (topComment?.baseScore ?? 0) >= 0.75 * totalKarmaChange
      )
    ) {
      this.parts.push("One-Hit Wonder");
    } else if (
      engagementPercentile >= 0.9 &&
      postsWritten === 0 &&
      commentsWritten < 5
    ) {
      this.parts.push("Lurker");
    } else {
      this.parts.push("Visitor");
    }
  }

  toString() {
    return this.parts.join(" ");
  }
}
