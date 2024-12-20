export interface ArbitalPage {
  pageId: string;
  title: string;
  oneLiner: string;
  parentPageId: string | null;
  relationship_type: string | null;
  text_length: number;
  authorName: string;
  commentCount: number;
}

export interface TagContributor {
  user: UsersMinimumInfo;
  contributionScore: number;
  currentAttributionCharCount: number;
  numCommits: number;
  voteCount: number;
}

export interface ArbitalPageWithMatchedData extends ArbitalPage {
  newSlug?: string;
  contributors?: {
    contributors: TagContributor[];
  };
}

export interface ArbitalPageNode extends ArbitalPageWithMatchedData {
  children: ArbitalPageNode[];
} 
