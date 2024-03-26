export interface ToCAnswer {
  baseScore: number,
  voteCount: number,
  postedAt: Date | string, // Date on server, string on client
  author: string | null,
  highlight: string,
  shortHighlight: string,
}

export interface AnchorOffset {
  anchorHref: string | null,
  offset: number
}

export interface ToCSection {
  title?: string,
  answer?: ToCAnswer,
  anchor: string,
  level: number,
  divider?: boolean,
  offset?: number,
}

export interface ToCSectionWithOffset extends ToCSection {
  offset: number,
}

export interface ToCData {
  html: string | null,
  sections: ToCSection[],
  headingsCount: number,
}
