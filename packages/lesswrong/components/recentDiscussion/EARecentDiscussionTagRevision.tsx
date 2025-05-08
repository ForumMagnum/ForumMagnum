import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import {taggingNameSetting} from '../../lib/instanceSettings'
import { EARecentDiscussionItem } from "./EARecentDiscussionItem";
import { TagRevisionItem } from "../tagging/TagRevisionItem";

const EARecentDiscussionTagRevisionInner = ({
  tag,
  revision,
  collapsed,
  headingStyle,
  documentId,
}: {
  tag: TagRecentDiscussion,
  revision: RevisionHistoryEntry,
  collapsed?: boolean,
  headingStyle: "full"|"abridged",
  documentId: string,
}) => {
  return (
    <EARecentDiscussionItem
      icon="TagFilled"
      iconVariant="green"
      user={revision.user}
      action={`edited ${taggingNameSetting.get()}`}
      tag={tag}
      timestamp={revision.editedAt}
    >
      <TagRevisionItem
        tag={tag}
        revision={revision}
        collapsed={collapsed}
        headingStyle={headingStyle}
        documentId={documentId}
        showDiscussionLink={false}
        noContainer
      />
    </EARecentDiscussionItem>
  );
}

export const EARecentDiscussionTagRevision = registerComponent(
  "EARecentDiscussionTagRevision",
  EARecentDiscussionTagRevisionInner,
);

declare global {
  interface ComponentTypes {
    EARecentDiscussionTagRevision: typeof EARecentDiscussionTagRevision,
  }
}
