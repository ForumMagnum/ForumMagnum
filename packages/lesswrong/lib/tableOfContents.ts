export interface ToCAnswer {
  baseScore: number,
  voteCount: number,
  postedAt: Date | string, // Date on server, string on client
  author: string,
  highlight: string,
  shortHighlight: string,
}

export interface ToCSection {
  title?: string,
  answer?: ToCAnswer,
  anchor: string,
  level: number,
  divider?: boolean,
  hide?: boolean,
}

export interface ToCData {
  html: string | null,
  sections: ToCSection[],
  headingsCount: number,
}
