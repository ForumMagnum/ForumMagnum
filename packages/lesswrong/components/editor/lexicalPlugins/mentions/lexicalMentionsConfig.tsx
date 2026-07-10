"use client";

import React from 'react';
import { getSearchClient, getSearchIndexName } from '../../../../lib/search/searchUtil';
import { userGetDisplayName } from '../../../../lib/collections/users/helpers';
import { userMentionQueryString } from '../../../../lib/pingback';
import { filterNonnull } from '../../../../lib/utils/typeGuardUtils';
import { getSiteUrl } from '../../../../lib/vulcan-lib/utils';
import type { MentionItem } from './MentionDropdown';
import { defineStyles, useStyles } from '../../../hooks/useStyles';

const MARKER = "@";

export interface MentionFeed {
  /** The marker character that triggers this feed (e.g., '@', '#') */
  marker: string;
  /** Async lookup that returns the suggestions for a given query */
  feed: (query: string) => Promise<MentionItemWithHit[]>;
  /** Minimum characters after marker before showing suggestions (default: 0) */
  minimumCharacters?: number;
  /** Custom item renderer */
  itemRenderer?: (item: MentionItemWithHit) => React.ReactNode;
}

const styles = defineStyles('LexicalMentionItem', (theme: ThemeType) => ({
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
  },
  icon: {
    fontSize: '16px',
    width: '20px',
    textAlign: 'center',
    flexShrink: 0,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: '14px',
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  meta: {
    fontSize: '12px',
    color: theme.palette.grey[600],
    display: 'flex',
    gap: '8px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  userMeta: {
    display: 'flex',
    gap: '8px',
  },
}), { allowNonThemeColors: true });

// Extended MentionItem with hit data for rendering
interface MentionItemWithUserHit extends MentionItem {
  type: 'Users';
  hit: SearchUser;
}

interface MentionItemWithPostHit extends MentionItem {
  type: 'Posts';
  hit: SearchPost;
}

interface MentionItemWithTagHit extends MentionItem {
  type: 'Tags';
  hit: SearchTag;
}

export type MentionItemWithHit = MentionItemWithUserHit | MentionItemWithPostHit | MentionItemWithTagHit;

/**
 * Type guard to check if hit is a SearchUser
 */
function isSearchUser(hit: SearchUser | SearchPost | SearchTag): hit is SearchUser {
  return hit._index === "users";
}

/**
 * Type guard to check if hit is a SearchPost
 */
function isSearchPost(hit: SearchUser | SearchPost | SearchTag): hit is SearchPost {
  return hit._index === "posts";
}

/**
 * Type guard to check if hit is a SearchTag
 */
function isSearchTag(hit: SearchUser | SearchPost | SearchTag): hit is SearchTag {
  return hit._index === "tags";
}

/**
 * Format a search hit into a MentionItem
 */
function formatSearchHit(hit: SearchUser | SearchPost | SearchTag): MentionItemWithHit | null {
  const linkPrefix = getSiteUrl();

  if (isSearchUser(hit)) {
    const displayName = MARKER + userGetDisplayName(hit);
    const result: MentionItemWithUserHit = {
      type: "Users",
      id: displayName,
      link: `${linkPrefix}users/${hit.slug}?${userMentionQueryString}`,
      text: displayName,
      label: userGetDisplayName(hit),
      description: `${hit.karma || 0} karma`,
      hit,
    };
    return result;
  }
  
  if (isSearchPost(hit)) {
    const result: MentionItemWithPostHit = {
      type: "Posts",
      id: MARKER + hit.title,
      link: `${linkPrefix}posts/${hit._id}/${hit.slug}`,
      text: hit.title ?? undefined,
      label: hit.title ?? undefined,
      hit,
    };
    return result;
  }
  
  if (isSearchTag(hit)) {
    const result: MentionItemWithTagHit = {
      type: "Tags",
      id: MARKER + hit.name,
      link: `${linkPrefix}w/${hit.slug}`,
      text: hit.name,
      label: hit.name,
      hit,
    };
    return result;
  }
  
  return null;
}

const collectionNames = ["Posts", "Users", "Tags"] as const;

/**
 * Fetch mention suggestions from Algolia
 */
async function fetchMentionableSuggestions(searchString: string): Promise<MentionItemWithHit[]> {
  if (!searchString.trim()) {
    return [];
  }
  
  try {
    const indexName = collectionNames.map(getSearchIndexName).join(",");
    const searchClient = getSearchClient();
    const response = await searchClient.search<SearchUser | SearchPost | SearchTag>([{
      indexName,
      query: searchString,
      params: {
        query: searchString,
        hitsPerPage: 7,
      },
    }]);
    const hits = response?.results?.[0]?.hits;
    return Array.isArray(hits) ? filterNonnull(hits.map(formatSearchHit)) : [];
  } catch {
    // Search failed - return empty results
    return [];
  }
}

/**
 * Component to render a user mention item
 */
function UserMentionItem({ hit }: { hit: SearchUser }) {
  const classes = useStyles(styles);
  return (
    <div className={classes.item}>
      <span className={classes.icon}>👤</span>
      <div className={classes.content}>
        <div className={classes.title}>{hit.displayName}</div>
        <div className={classes.meta}>
          <span>{hit.karma || 0} karma</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Component to render a post mention item
 */
function PostMentionItem({ hit }: { hit: SearchPost }) {
  const classes = useStyles(styles);
  return (
    <div className={classes.item}>
      <span className={classes.icon}>📄</span>
      <div className={classes.content}>
        <div className={classes.title}>{hit.title}</div>
      </div>
    </div>
  );
}

/**
 * Component to render a tag mention item
 */
function TagMentionItem({ hit }: { hit: SearchTag }) {
  const classes = useStyles(styles);
  return (
    <div className={classes.item}>
      <span className={classes.icon}>🏷️</span>
      <div className={classes.content}>
        <div className={classes.title}>{hit.name}</div>
      </div>
    </div>
  );
}

function mentionItemRenderer(item: MentionItemWithHit): React.ReactNode {
  switch (item.type) {
    case 'Users': return <UserMentionItem hit={item.hit} />;
    case 'Posts': return <PostMentionItem hit={item.hit} />;
    case 'Tags': return <TagMentionItem hit={item.hit} />;
  }
}

/**
 * Get the mention feeds configuration for Lexical
 */
export function getLexicalMentionFeeds(): MentionFeed[] {
  return [
    {
      marker: MARKER,
      feed: fetchMentionableSuggestions,
      minimumCharacters: 1,
      itemRenderer: mentionItemRenderer,
    },
  ];
}

export default getLexicalMentionFeeds;


