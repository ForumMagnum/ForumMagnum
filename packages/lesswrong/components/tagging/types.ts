export interface WikiTagMockup {
  _id: string;
  name: string;
  slug: string;
  postCount: number;
  description_html: string;
  description_length: number;
  viewCount?: number;
  parentTagId?: string | null;
}

export interface WikiTagNode extends WikiTagMockup {
  children: WikiTagNode[];
} 
