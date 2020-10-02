import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Tags } from '../../lib/collections/tags/collection';

const TagActivityFeed = ({classes}: {
  classes: ClassesType
}) => {
  const { SingleColumnSection, MixedTypeFeed, TagRevisionItem, CommentsNode, UsersName, FormatDate, NewTagItem, SectionTitle } = Components;
  
  return <SingleColumnSection>
    <SectionTitle title="Recent Tag/Wiki Activity"/>
    <MixedTypeFeed
      pageSize={50}
      resolverName="AllTagsActivityFeed"
      sortKeyType="Date"
      renderers={{
        tagCreated: {
          fragmentName: "TagCreationHistoryFragment",
          render: (tag: TagCreationHistoryFragment) =>
            <NewTagItem tag={tag} />
        },
        tagRevision: {
          fragmentName: "RevisionTagFragment",
          render: (revision: RevisionTagFragment) => <div>
            {revision?.tag && <TagRevisionItem
              tag={revision.tag}
              revision={revision}
              headingStyle="full"
              documentId={revision.tag._id}
            />}
          </div>,
        },
        tagDiscussionComment: {
          fragmentName: "CommentsListWithParentMetadata",
          render: (comment: CommentsListWithParentMetadata) => <div>
            <CommentsNode
              comment={comment}
              loadChildrenSeparately={true}
              showPostTitle={true}
            />
          </div>
        }
      }}
    />
  </SingleColumnSection>
}

const TagActivityFeedComponent = registerComponent("TagActivityFeed", TagActivityFeed);

declare global {
  interface ComponentTypes {
    TagActivityFeed: typeof TagActivityFeedComponent
  }
}
