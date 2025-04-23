// This file contains types shared between server and client Recombee logic
// to avoid dependency cycles.

export interface RecombeeRecommendedPost {
  post: Partial<DbPost>;
  scenario: string;
  recommId: string;
  generatedAt?: Date;
  curated?: never;
  stickied?: never;
}

export interface NativeRecommendedPost {
  post: Partial<DbPost>;
  scenario?: never;
  recommId?: never;
  generatedAt?: never;
  curated: boolean;
  stickied: boolean;
}

export type RecommendedPost = RecombeeRecommendedPost | NativeRecommendedPost; 
