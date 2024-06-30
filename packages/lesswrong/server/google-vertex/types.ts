interface Setting<T extends U | null = any, U = any> {
  get: () => T;
}

type ClientSettingDependencies<T extends `${string}Setting` = `${string}Setting`> = {
  [k in T]: Setting
};

type SettingName<T extends `${string}Setting`> = T extends `${infer Name}Setting` ? Name : never;

type ClientSettings<T extends ClientSettingDependencies<`${string}Setting`>> = {
  [k in SettingName<keyof T & `${string}Setting`>]: Exclude<ReturnType<T[`${k}Setting`]['get']>, null>
}

interface CreateGoogleMediaDocumentMetadataArgs {
  post: DbPost;
  tags?: {
    _id: string;
    name: string;
    core: boolean;
  }[];
  authorIds?: string[];
}

type GoogleMediaPersonOrgRole = 'director' | 'actor' | 'player' | 'team' | 'league' | 'editor' | 'author' | 'character' | 'contributor' | 'creator' | 'editor' | 'funder' | 'producer' | 'provider' | 'publisher' | 'sponsor' | 'translator' | 'music-by' | 'channel' | 'custom-role';

interface GoogleMediaDocumentMetadata {
  title: string;
  categories: string[];
  uri: string;
  description?: string;
  /**
   * For document recommendation, this field is ignored and the text language is detected automatically.
   * The document can include text in different languages, but duplicating documents to provide text in multiple languages can result in degraded performance.
   */
  language_code?: string;
  images?: Array<{
    uri?: string;
    name?: string;
  }>;
  duration?: string;
  /**
   * The time that the content is available to the end-users. This field identifies the freshness of a content for end-users. The timestamp should conform to RFC 3339 standard.
   */
  available_time: string;
  expire_time?: string;
  media_type?: 'episode' | 'movie' | 'concert' | 'event' | 'live-event' | 'broadcast' | 'tv-series' | 'video-game' | 'clip' | 'vlog' | 'audio' | 'audio-book' | 'music' | 'album' | 'articles' | 'news' | 'radio' | 'podcast' | 'book' | 'sports-game';
  in_languages?: string[];
  country_of_origin?: string;
  filter_tags?: string[];
  hash_tags?: string[];
  content_rating?: string[];
  persons?: Array<{
    name: string;
    role: GoogleMediaPersonOrgRole;
    custom_role?: string;
    rank?: number;
    uri?: string;
  }>;
  organizations?: Array<{
    name: string;
    role: GoogleMediaPersonOrgRole;
    custom_role?: string;
    /**
     * Is this really a string?  That's what their JSON schema says, but it's an int for `persons`...
     */
    rank?: string;
    uri?: string;
  }>;
  aggregate_ratings?: Array<{
    rating_source: string;
    rating_score?: number;
    rating_count?: number;
  }>
}

interface PostEvent {
  userId: string;
  postId: string;
  timestamp: Date;
  attributionId?: string | null;
}

interface ReadStatusWithPostId extends DbReadStatus {
  postId: string;
}

interface FrontpageViewEvent {
  userId: string;
  timestamp: Date;
}

type SupportedPostEventTypes = 'view-item' | 'media-play' | 'media-complete';

export type {
  Setting,
  ClientSettingDependencies,
  ClientSettings,
  CreateGoogleMediaDocumentMetadataArgs,
  FrontpageViewEvent,
  GoogleMediaDocumentMetadata,
  GoogleMediaPersonOrgRole,
  PostEvent,
  ReadStatusWithPostId,
  SettingName,
  SupportedPostEventTypes,
};
