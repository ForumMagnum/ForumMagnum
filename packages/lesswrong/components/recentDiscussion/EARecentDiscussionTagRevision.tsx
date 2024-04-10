import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";

const EARecentDiscussionTagRevision = ({
  tag,
  revision,
  collapsed,
  headingStyle,
  documentId,
}: {
  tag: TagRecentDiscussion,
  revision: RevisionMetadataWithChangeMetrics,
  collapsed?: boolean,
  headingStyle: "full"|"abridged",
  documentId: string,
  classes: ClassesType,
}) => {
  const {EARecentDiscussionItem, TagRevisionItem} = Components;
  return (
    <EARecentDiscussionItem
      icon="TagFilled"
      iconVariant="green"
      user={revision.user}
      action="edited tag"
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

const EARecentDiscussionTagRevisionComponent = registerComponent(
  "EARecentDiscussionTagRevision",
  EARecentDiscussionTagRevision,
);

declare global {
  interface ComponentTypes {
    EARecentDiscussionTagRevision: typeof EARecentDiscussionTagRevisionComponent,
  }
}
