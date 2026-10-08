export const OPEN_THREAD_BODY_MARKDOWN = `If it's worth saying, but not worth its own post, here's a place to put it.

If you are new to LessWrong, here's the place to introduce yourself. Personal stories, anecdotes, or just general comments on how you found us and what you hope to get from the site and community are invited. This is also the place to discuss feature requests and other ideas you have for the site, if you don't want to write a full top-level post.

If you're new to the community, you can start reading the [Highlights from the Sequences](/highlights), a collection of posts about the core ideas of LessWrong.

If you want to explore the community more, I recommend [reading the Library](/library), [checking recent Curated posts](/curated), [seeing if there are any meetups in your area](/community), and checking out the [Getting Started](/faq#Getting_Started) section of the [LessWrong FAQ](/faq). If you want to orient to the content on the site, you can also check out the [Concepts section](/tags/all).

The Open Thread tag is [here](/tag/open-threads?sortedBy=new). The Open Thread sequence is [here](/s/yai5mppkuCHPQmzpN).`;

export type OpenThreadSeasonName = "Spring" | "Summer" | "Autumn" | "Winter";

export interface SeasonalOpenThreadInfo {
  season: OpenThreadSeasonName;
  year: number;
  intendedAt: Date;
  title: string;
}

const getOpenThreadSeason = (date: Date): OpenThreadSeasonName | null => {
  if (date.getUTCDate() !== 1) {
    return null;
  }

  switch (date.getUTCMonth()) {
    case 2:
      return "Spring";
    case 5:
      return "Summer";
    case 8:
      return "Autumn";
    case 11:
      return "Winter";
    default:
      return null;
  }
};

export const getSeasonalOpenThreadTitle = (season: OpenThreadSeasonName, year: number): string => {
  if (season === "Winter") {
    const nextYearShort = String((year + 1) % 100).padStart(2, "0");
    return `Open Thread Winter ${year}/${nextYearShort}`;
  }

  return `Open Thread ${season} ${year}`;
};

export const getSeasonalOpenThreadInfo = (date = new Date()): SeasonalOpenThreadInfo | null => {
  const season = getOpenThreadSeason(date);
  if (!season) {
    return null;
  }

  const year = date.getUTCFullYear();
  const intendedAt = new Date(Date.UTC(year, date.getUTCMonth(), 1));

  return {
    season,
    year,
    intendedAt,
    title: getSeasonalOpenThreadTitle(season, year),
  };
};
