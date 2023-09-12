import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";

const EARecentDiscussionTag = ({
  tag,
  revision,
  collapsed,
  headingStyle,
  documentId,
}: {
  tag: TagBasicInfo,
  revision: RevisionMetadataWithChangeMetrics,
  collapsed?: boolean,
  headingStyle: "full"|"abridged",
  documentId: string,
  classes: ClassesType,
}) => {
  const {EARecentDiscussionItem, TagRevisionItem} = Components;
  return (
    <EARecentDiscussionItem
      icon="RecentDiscussionTag"
      user={revision.user}
      description="edited tag"
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

const EARecentDiscussionTagComponent = registerComponent(
  "EARecentDiscussionTag",
  EARecentDiscussionTag,
);

declare global {
  interface ComponentTypes {
    EARecentDiscussionTag: typeof EARecentDiscussionTagComponent,
  }
}
