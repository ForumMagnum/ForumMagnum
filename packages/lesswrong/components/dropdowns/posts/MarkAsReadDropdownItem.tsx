import React from "react";
import { registerComponent, Components } from "../../../lib/vulcan-lib";

import { useItemsRead } from "../../hooks/useRecordPostView";
import { useMutate } from "@/components/hooks/useMutate";
import { gql } from "@apollo/client";
import { preferredHeadingCase } from "../../../themes/forumTheme";

const MarkAsReadDropdownItem = ({post}: {post: PostsBase}) => {
  const {postsRead, setPostRead} = useItemsRead();
  const {mutate} = useMutate();

  const setRead = (value: boolean) => {
    void mutate({
      mutation: gql`
        mutation markAsReadOrUnread($postId: String!, isRead: Boolean!) {
          markAsReadOrUnread(postId: $postId, isRead: $isRead)
        }
      `,
      variables: {
        postId: post._id,
        isRead: value,
      },
      errorHandling: "flashMessageAndReturn",
      
    });
    setPostRead(post._id, value);
  }

  const isRead = (post._id in postsRead) ? postsRead[post._id] : post.isRead;

  const {DropdownItem} = Components;
  const title = isRead ? "Mark as Unread" : "Mark as Read";
  return (
    <DropdownItem
      title={preferredHeadingCase(title)}
      onClick={setRead.bind(null, !isRead)}
    />
  );
}

const MarkAsReadDropdownItemComponent = registerComponent(
  "MarkAsReadDropdownItem",
  MarkAsReadDropdownItem,
);

declare global {
  interface ComponentTypes {
    MarkAsReadDropdownItem: typeof MarkAsReadDropdownItemComponent
  }
}
