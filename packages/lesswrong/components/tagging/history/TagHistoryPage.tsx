import React from 'react'
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { useTagBySlug } from '../useTag';
import { useLocation } from '../../../lib/routeUtil';
import { useMulti } from '../../../lib/crud/withMulti';

interface HistoryEntry {
  sortPosition: Date,
  component: React.ReactNode,
}

const styles = theme => ({
});

const tagCreationHistoryEntry = (tag: TagHistoryFragment): HistoryEntry => {
  const {UsersName} = Components;
  return {
    sortPosition: tag.createdAt,
    component: <div>
      Created by <UsersName user={tag.user}/>
    </div>
  };
}

const revisionToHistoryEntry = (rev: RevisionMetadataWithChangeMetrics): HistoryEntry => {
  const {UsersName} = Components;
  return {
    sortPosition: rev.editedAt,
    component: <div>
      Edited by <UsersName documentId={rev.userId}/>
    </div>
  };
}

const TagHistoryPage = ({classes}: {
  classes: ClassesType,
}) => {
  const { params } = useLocation();
  const { slug } = params;
  const { tag, loading } = useTagBySlug(slug, "TagHistoryFragment");
  
  const {components, loadMore} = useFeed({
    resolverName: "TagHistoryFeed",
    fragmentName: "TagHistoryFeedFragment",
    render: {
      tagCreated: (creation: TagHistoryFeedFragment_tagCreated) =>
        <div>
          Created by <UsersName user={creation.user}/>
        </div>
      tagRevision: (revision: TagHistoryFeedFragment_tagRevision) =>
        <div>
          Edited by <UsersName user={revision.user}/>
        </div>
      tagApplied: (application: TagHistoryFeedFragment_tagApplied) =>
        <div>
          Tag applied by <UsersName user={application.user}/> to {application.post.title}
        </div>
    },
  });
  
  const {SingleColumnSection, Loading} = Components;
  return <SingleColumnSection>
    {tag && <h1>{tag.name}</h1>}
    {components}
  </SingleColumnSection>
  
  /*const { results: revisions, loading: loadingRevisions, loadMoreProps } = useMulti({
    skip: !tag,
    terms: {
      view: "revisionsOnDocument",
      documentId: tag?._id,
      fieldName: "description",
      limit: 100,
    },
    fetchPolicy: "cache-then-network" as any,
    collectionName: "Revisions",
    fragmentName: "RevisionMetadataWithChangeMetrics",
    ssr: true,
  });
  
  const historyEntries = [
    (tag && tagCreationHistoryEntry(tag)),
    ...(revisions
      ? revisions.map((rev: RevisionMetadataWithChangeMetrics) => revisionToHistoryEntry(tag))
      : []
    )
  ];
  
  const {SingleColumnSection, Loading} = Components;
  return <SingleColumnSection>
    {tag && <h1>{tag.name}</h1>}
    {loading && <Loading/>}
    {historyEntries.map(entry => entry.component)}
  </SingleColumnSection>*/
}

const TagHistoryPageComponent = registerComponent("TagHistoryPage", TagHistoryPage, {styles});

declare global {
  interface ComponentTypes {
    TagHistoryPage: typeof TagHistoryPageComponent
  }
}
