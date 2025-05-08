import { gql, useQuery } from "@apollo/client";
import { registerComponent } from "../../lib/vulcan-lib/components";
import React from "react";
import { ContentItemBody } from "../common/ContentItemBody";
import { Loading } from "../vulcan-core/Loading";
import { NoContent } from "../common/NoContent";

const PostsItemNewDialogueResponsesInner = ({postId, unreadCount}: {postId: string, unreadCount: number}) => {
  const { data, loading } = useQuery(gql`
    query LatestDialogueMessages($dialogueId: String!, $unreadCount: Int!) {
      latestDialogueMessages(dialogueId: $dialogueId, numMessages: $unreadCount)
    }
  `, {variables: {dialogueId: postId, unreadCount  }});

  return loading ? <Loading /> : data ? data.latestDialogueMessages && data.latestDialogueMessages.length ? <ContentItemBody
    dangerouslySetInnerHTML={{__html: data.latestDialogueMessages.join('')}} />
    : <NoContent>No new responses found</NoContent> : <div></div>
}

export const PostsItemNewDialogueResponses = registerComponent('PostsItemNewDialogueResponses', PostsItemNewDialogueResponsesInner);

declare global {
  interface ComponentTypes {
    PostsItemNewDialogueResponses: typeof PostsItemNewDialogueResponses
  }
}
