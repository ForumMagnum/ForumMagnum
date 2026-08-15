export type ReviewCollectionName = 'Posts' | 'Comments';

export interface PangramWindowScore {
  text: string;
  score: number;
  startIndex: number;
  endIndex: number;
}

export interface QueueItem {
  documentId: string;
  collectionName: ReviewCollectionName;
  postedAt: string;
  title: string | null;
  postTitle: string | null;
  postId: string | null;
  html: string | null;
  baseScore: number | null;
  pangramScore: number | null;
  pangramFractionAi: number | null;
  pangramPrediction: string | null;
  pangramWindowScores: PangramWindowScore[] | null;
  aiChoice: string | null;
  rejected: boolean;
  itemUrl: string;
  parentCommentHtml: string | null;
  parentCommentAuthor: string | null;
}

export interface UserContentItem extends QueueItem {
  status: 'approved' | 'unreviewed' | 'rejected' | 'draft';
}

export interface UserContextResponse {
  items: UserContentItem[];
}

export interface RunCheckResponse {
  pangramScore: number | null;
  pangramFractionAi: number | null;
  pangramPrediction: string | null;
  pangramWindowScores: PangramWindowScore[] | null;
  alreadyExisted: boolean;
}

export interface QueueUser {
  _id: string;
  displayName: string;
  slug: string;
  createdAt: string;
  karma: number;
  postCount: number;
  commentCount: number;
  htmlBio: string | null;
  sunshineFlagged: boolean;
  sunshineNotes: string;
  reviewGroup: 'newContent' | 'offboard';
  postingDisabled: boolean;
  allCommentingDisabled: boolean;
  conversationsDisabled: boolean;
  profileUrl: string;
}

export interface ContentCardData {
  type: 'content';
  user: QueueUser;
  item: QueueItem;
  remainingCount: number;
}

export interface OffboardCardData {
  type: 'offboard';
  user: QueueUser;
  items: QueueItem[];
  rejectedPostCount: number;
  rejectedCommentCount: number;
}

export interface WrapupCardData {
  type: 'wrapup';
  user: QueueUser;
}

export type QueueCard = ContentCardData | OffboardCardData | WrapupCardData;

export interface QueueResponse {
  cards: QueueCard[];
  moderator: { _id: string; displayName: string };
}

export interface ModerationTemplateData {
  _id: string;
  name: string;
  collectionName: string;
  html: string | null;
}

export interface NextItemResponse {
  nextItem: QueueItem | null;
  remainingCount: number;
}

export interface EarliestItemConflict {
  error: string;
  currentEarliest: QueueItem | null;
}
