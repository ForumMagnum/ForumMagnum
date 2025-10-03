import { getSearchClient, getSearchIndexName } from '../search/searchUtil'
import React from 'react'
import {userGetDisplayName} from '../collections/users/helpers'
import {userMentionQueryString} from '../pingback'
import {tagUrlBaseSetting} from '@/lib/instanceSettings'
import { filterNonnull } from '../utils/typeGuardUtils'
import { getSiteUrl } from "../vulcan-lib/utils";
import UserMentionHit from '@/components/search/UserMentionHit'
import PostMentionHit from '@/components/search/PostMentionHit'
import TagMentionHit from '@/components/search/TagMentionHit'
import { CkEditorPortalContextType } from '@/components/editor/CKEditorPortalProvider'

const MARKER = "@";

const formatSearchHit = (hit: SearchUser | SearchPost | SearchTag) => {
  const linkPrefix = getSiteUrl();

  switch (hit._index) {
    case "users":
      const displayName = MARKER + userGetDisplayName(hit);
      return {
        type: "Users",
        id: displayName,
        // Query string is intended for later use in detecting the ping
        link: `${linkPrefix}users/${hit.slug}?${userMentionQueryString}`,
        text: displayName,
        hit,
      };
    case "posts":
      return {
        type: "Posts",
        // What gets displayed in the dropdown results, must have postMarker
        id: MARKER + hit.title,
        link: `${linkPrefix}posts/${hit._id}/${hit.slug}`,
        text: hit.title,
        hit,
      };
    case "tags":
      return {
        type: "Tags",
        id: MARKER + hit.name,
        link: `${linkPrefix}${tagUrlBaseSetting.get()}/${hit.slug}`,
        text: hit.name,
        hit,
      };
    default:
      return null;
  }
}

const collectionNames = ["Posts", "Users", "Tags"] as const;

const fetchMentionableSuggestions = async (searchString: string) => {
  const indexName = collectionNames.map(getSearchIndexName).join(",");
  const searchClient = getSearchClient();
  const response = await searchClient.search<SearchUser | SearchPost | SearchTag>([{
    indexName,
    query: searchString,
    params: {
      query: searchString,
      hitsPerPage: 7,
    },
  }])
  const hits = response?.results?.[0]?.hits;
  return Array.isArray(hits) ? filterNonnull(hits.map(formatSearchHit)) : [];
}

type MentionUser = {
  type: "Users",
  hit: SearchUser,
}

type MentionPost = {
  type: "Posts",
  hit: SearchPost,
}

type MentionTag = {
  type: "Tags",
  hit: SearchTag,
}

type MentionItem = (MentionUser | MentionPost | MentionTag) & {
  id: string
  text: string
  link: string
}

const itemRenderer = (portalContext: CkEditorPortalContextType|null) => (item: MentionItem) => {
  const itemElement = document.createElement("button");
  itemElement.classList.add("ck-mention-item", "ck-reset_all-excluded");
  itemElement.style.cursor = "pointer";

  if (portalContext) {
    portalContext.createPortal(itemElement, <MentionHit item={item}/>);
  }

  return itemElement;
}

const MentionHit = ({item}: {item: MentionItem}) => {
  switch (item.type) {
    case "Users": return <UserMentionHit hit={item.hit} />;
    case "Posts": return <PostMentionHit hit={item.hit} />;
    case "Tags": return <TagMentionHit hit={item.hit} />;
    default:
      return null;
  }
}

export const mentionPluginConfiguration = (portalContext: CkEditorPortalContextType|null) => ({
  feeds: [
    {
      marker: MARKER,
      feed: fetchMentionableSuggestions,
      minimumCharacters: 1,
      itemRenderer: itemRenderer(portalContext),
    },
  ],
})
