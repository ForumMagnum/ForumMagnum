import { gql } from "@apollo/client";
import { useQuery } from "@/lib/crud/useQuery";
import { registerComponent } from "../../lib/vulcan-lib/components";
import React from "react";
import ContentItemBody from "../common/ContentItemBody";
import Loading from "../vulcan-core/Loading";
import NoContent from "../common/NoContent";

const PostsItemNewDialogueResponses = ({postId, unreadCount}: {postId: string, unreadCount: number}) => {
  const { data, loading } = useQuery(gql`
    query LatestDialogueMessages($dialogueId: String!, $unreadCount: Int!) {
      latestDialogueMessages(dialogueId: $dialogueId, numMessages: $unreadCount)
    }
  `, {variables: {dialogueId: postId, unreadCount  }});

  return loading ? <Loading /> : data ? data.latestDialogueMessages && data.latestDialogueMessages.length ? <ContentItemBody
    dangerouslySetInnerHTML={{__html: data.latestDialogueMessages.join('')}} />
    : <NoContent>No new responses found</NoContent> : <div></div>
}

export default registerComponent('PostsItemNewDialogueResponses', PostsItemNewDialogueResponses);


