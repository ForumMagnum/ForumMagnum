export type SearchResultHit = DbObject

export type SearchResult = {
  hits: SearchResultHit[],
  nbHits: number,
  page: number,
  nbPages: number,
  hitsPerPage: number,
  exhaustiveNbHits: boolean,
  exhaustiveType: boolean,
  exhaustive: {
    nbHits: boolean,
    typo: boolean,
  },
  query: string,
  params: string,
  index: string,
  processingTimeMS: number,
  processingTimingsMS: {
    request: {
      roundTrip: number,
    },
  },
  serverTimeMS: number,
}
