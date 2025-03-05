import { gql } from "@apollo/client";
import { useQuery } from '@/lib/crud/useQuery';
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import React from "react";

const PostsItemNewDialogueResponses = ({postId, unreadCount}: {postId: string, unreadCount: number}) => {
  
  const { ContentItemBody, Loading, NoContent }= Components

  const { data, loading } = useQuery(gql`
    query LatestDialogueMessages($dialogueId: String!, $unreadCount: Int!) {
      latestDialogueMessages(dialogueId: $dialogueId, numMessages: $unreadCount)
    }
  `, {variables: {dialogueId: postId, unreadCount  }});

  return loading ? <Loading /> : data ? data.latestDialogueMessages && data.latestDialogueMessages.length ? <ContentItemBody
    dangerouslySetInnerHTML={{__html: data.latestDialogueMessages.join('')}} />
    : <NoContent>No new responses found</NoContent> : <div></div>
}

const PostsItemNewDialogueResponsesComponent = registerComponent('PostsItemNewDialogueResponses', PostsItemNewDialogueResponses);

declare global {
  interface ComponentTypes {
    PostsItemNewDialogueResponses: typeof PostsItemNewDialogueResponsesComponent
  }
}
