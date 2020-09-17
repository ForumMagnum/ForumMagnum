import React, { useCallback } from 'react'
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useLocation, useNavigation } from '../../lib/routeUtil';
import { useTagBySlug } from '../tagging/useTag';
import { useMulti } from '../../lib/crud/withMulti';
import { Tags } from '../../lib/collections/tags/collection';


const styles = (theme: ThemeType): JssStyles => ({
});

const TagEditActivity = ({ classes }: {
  classes: ClassesType
}) => {
  const { params } = useLocation();
  const { slug } = params;
  const { history } = useNavigation();

  const { SingleColumnSection, Loading, RevisionSelect, TagRevisionItem, LoadMore } = Components;

  // const { tag, loading: loadingTag } = useTagBySlug(slug, "TagBasicInfo");

  const { tag, loading: loadingTag } = useTagBySlug(slug, "TagBasicInfo");
  const { results: revisions, loading: loadingRevisions, loadMoreProps, count, totalCount } = useMulti({
    skip: !tag,
    terms: {
      view: "revisionsOnCollection",
      collectionName: "Tags",
    },
    limit: 50,
    fetchPolicy: "cache-then-network" as any,
    collectionName: "Revisions",
    fragmentName: "RevisionMetadataWithChangeMetrics",
    ssr: true,
    enableTotal: true
  });

  const getRevisionUrl = (rev: RevisionMetadata) => `${Tags.getUrl(tag)}?revision=${rev.version}`
  return <SingleColumnSection>

    {(loadingRevisions) && <Loading/>}
    {revisions && <div>
      {revisions.map((rev, i)=> {
        return <div key={rev.version}>
          <TagRevisionItem
            key={rev.version}
            documentId={rev.documentId}
            revision={rev}
            previousRevision={revisions[i+1]}
            getRevisionUrl={getRevisionUrl}
            showTagTitle
          />
          </div>
      })}
      <LoadMore {...loadMoreProps}/>
    </div>}
  </SingleColumnSection>
}

const TagEditActivityComponent = registerComponent("TagEditActivity", TagEditActivity, {styles});

declare global {
  interface ComponentTypes {
    TagEditActivity: typeof TagEditActivityComponent
  }
}
