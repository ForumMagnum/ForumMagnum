export interface WikiTagMockup {
  _id: string;
  name: string;
  slug: string;
  baseScore: number;
  postCount: number;
  description_html: string;
  description_length: number;
  viewCount?: number;
  parentTagId?: string | null;
  coreTag?: string;
  isArbitalImport?: boolean;
}

export interface WikiTagNode extends ConceptItemFragment {
  parentTagId: string | null;
  baseScore: number;
  children: WikiTagNode[];
}
