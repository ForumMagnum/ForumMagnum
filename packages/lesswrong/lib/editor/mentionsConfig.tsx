import { getSearchClient, getSearchIndexName } from '../search/searchUtil'
import React from 'react'
import {createRoot} from 'react-dom/client'
import {userGetDisplayName} from '../collections/users/helpers'
import {userMentionQueryString} from '../pingback'
import {tagUrlBaseSetting} from '@/lib/instanceSettings'
import { filterNonnull } from '../utils/typeGuardUtils'
import { Components } from "../vulcan-lib/components";
import { getSiteUrl } from "../vulcan-lib/utils";

const MARKER = "@";

const linkPrefix = getSiteUrl()

const formatSearchHit = (hit: SearchUser | SearchPost | SearchTag) => {
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

const itemRenderer = (item: MentionItem) => {
  const itemElement = document.createElement("button");
  itemElement.classList.add("ck-mention-item", "ck-reset_all-excluded");
  itemElement.style.cursor = "pointer";
  const root = createRoot(itemElement);
  switch (item.type) {
    case "Users":
      root.render(<Components.UserMentionHit hit={item.hit} />);
      break;
    case "Posts":
      root.render(<Components.PostMentionHit hit={item.hit} />);
      break;
    case "Tags":
      root.render(<Components.TagMentionHit hit={item.hit} />);
      break;
  }
  return itemElement;
}

export const mentionPluginConfiguration = {
  feeds: [
    {
      marker: MARKER,
      feed: fetchMentionableSuggestions,
      minimumCharacters: 1,
      itemRenderer,
    },
  ],
}
