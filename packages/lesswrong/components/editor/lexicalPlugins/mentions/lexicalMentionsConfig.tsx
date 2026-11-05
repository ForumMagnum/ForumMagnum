"use client";

import React from 'react';
import { getSearchClient, getSearchIndexName } from '../../../../lib/search/searchUtil';
import { userGetDisplayName } from '../../../../lib/collections/users/helpers';
import { userMentionQueryString } from '../../../../lib/pingback';
import { filterNonnull } from '../../../../lib/utils/typeGuardUtils';
import { combineUrls, getSiteUrl } from '../../../../lib/vulcan-lib/utils';
import { defineStyles, useStyles } from '../../../hooks/useStyles';
import ForumIcon, { type ForumIconName } from '@/components/common/ForumIcon';
import { llmMentionsEnabledSetting, type ForumTypeString } from '@/lib/instanceSettings';
import { LLM_FAMILIES, type LlmFamilyVersion } from '@/lib/languageModels/llmRegistry';
import { getLlmMentionPath, getMentionableLlms } from '@/lib/llmReplies/llmMentions';

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
    gap: 10,
    width: '100%',
    minWidth: 0,
  },
  icon: {
    '--icon-size': '16px',
    flexShrink: 0,
    color: theme.palette.grey[500],
  },
  title: {
    fontSize: 14.3,
    lineHeight: '20px',
    color: theme.palette.grey[900],
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  meta: {
    marginLeft: 'auto',
    flexShrink: 0,
    fontSize: 12.5,
    color: theme.palette.grey[600],
    whiteSpace: 'nowrap',
  },
}));

/**
 * A mention item that can be displayed in the dropdown
 */
interface MentionItem {
  /** Unique identifier (should start with the marker, e.g., "@username") */
  id: string;
  /** Display text (used as link text when inserted) */
  text?: string;
  /** URL to link to when the mention is inserted */
  link: string;
  /** Optional label to display (defaults to id) */
  label?: string;
  /** Optional description/subtitle */
  description?: string;
}

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

interface MentionItemWithModel extends MentionItem {
  type: 'Models';
  model: LlmFamilyVersion;
}

export type MentionItemWithHit = MentionItemWithUserHit | MentionItemWithPostHit | MentionItemWithTagHit | MentionItemWithModel;

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
function formatSearchHit(hit: SearchUser | SearchPost | SearchTag, forumType: ForumTypeString): MentionItemWithHit | null {
  const linkPrefix = getSiteUrl(forumType);

  if (isSearchUser(hit)) {
    const displayName = MARKER + userGetDisplayName(hit, forumType);
    const result: MentionItemWithUserHit = {
      type: "Users",
      id: displayName,
      link: `${linkPrefix}users/${hit.slug}?${userMentionQueryString}`,
      text: displayName,
      label: userGetDisplayName(hit, forumType),
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

function formatModelItem(model: LlmFamilyVersion, forumType: ForumTypeString): MentionItemWithModel {
  return {
    type: "Models",
    id: MARKER + model.version.fullName,
    link: combineUrls(getSiteUrl(forumType), getLlmMentionPath(model)),
    text: MARKER + model.version.fullName,
    label: model.version.fullName,
    model,
  };
}

const llmFamilyAccountSlugs = new Set(LLM_FAMILIES.map((family) => family.accountSlug));

const collectionNames = ["Posts", "Users", "Tags"] as const;

/**
 * Fetch mention suggestions from Algolia
 */
async function fetchMentionableSuggestions(forumType: ForumTypeString, searchString: string): Promise<MentionItemWithHit[]> {
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
    return Array.isArray(hits) ? filterNonnull(hits.map(hit => formatSearchHit(hit, forumType))) : [];
  } catch {
    // Search failed - return empty results
    return [];
  }
}

async function fetchMentionableSuggestionsWithModels(forumType: ForumTypeString, searchString: string): Promise<MentionItemWithHit[]> {
  const mentionableLlms = llmMentionsEnabledSetting.get(forumType) ? getMentionableLlms(searchString) : [];
  const modelItems = mentionableLlms.map((model) => formatModelItem(model, forumType));
  const searchItems = await fetchMentionableSuggestions(forumType, searchString);
  return [
    ...modelItems,
    ...searchItems.filter((item) => !(item.type === "Users" && llmFamilyAccountSlugs.has(item.hit.slug))),
  ];
}

/**
 * One row of the mention menu: an icon, the name, and optional metadata on the
 * right
 */
function MentionItemRow({ icon, title, meta }: {
  icon: ForumIconName,
  title: string | null | undefined,
  meta?: string,
}) {
  const classes = useStyles(styles);
  return (
    <div className={classes.item}>
      <ForumIcon icon={icon} className={classes.icon} />
      <span className={classes.title}>{title}</span>
      {meta && <span className={classes.meta}>{meta}</span>}
    </div>
  );
}

/**
 * Component to render a user mention item
 */
function UserMentionItem({ hit }: { hit: SearchUser }) {
  return <MentionItemRow icon="User" title={hit.displayName} meta={`${hit.karma || 0} karma`} />;
}

/**
 * Component to render a post mention item
 */
function PostMentionItem({ hit }: { hit: SearchPost }) {
  return <MentionItemRow icon="Post" title={hit.title} />;
}

/**
 * Component to render a tag mention item
 */
function TagMentionItem({ hit }: { hit: SearchTag }) {
  return <MentionItemRow icon="Tag" title={hit.name} />;
}

function ModelMentionItem({ model: { version } }: { model: LlmFamilyVersion }) {
  return <MentionItemRow icon="Sparkles" title={version.fullName} />;
}

function mentionItemRenderer(item: MentionItemWithHit): React.ReactNode {
  switch (item.type) {
    case 'Users': return <UserMentionItem hit={item.hit} />;
    case 'Posts': return <PostMentionItem hit={item.hit} />;
    case 'Tags': return <TagMentionItem hit={item.hit} />;
    case 'Models': return <ModelMentionItem model={item.model} />;
  }
}

/**
 * Get the mention feeds configuration for Lexical
 */
export function getLexicalMentionFeeds(forumType: ForumTypeString): MentionFeed[] {
  return [
    {
      marker: MARKER,
      feed: fetchMentionableSuggestionsWithModels.bind(null, forumType),
      minimumCharacters: 1,
      itemRenderer: mentionItemRenderer,
    },
  ];
}

export default getLexicalMentionFeeds;

