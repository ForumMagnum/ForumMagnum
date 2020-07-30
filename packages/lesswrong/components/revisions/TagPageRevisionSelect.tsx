import React, { useCallback } from 'react'
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useLocation, useNavigation } from '../../lib/routeUtil';
import { useTagBySlug } from '../tagging/useTag';
import { useMulti } from '../../lib/crud/withMulti';

const styles = (theme: ThemeType): JssStyles => ({
});

const TagPageRevisionSelect = ({ classes }: {
  classes: ClassesType
}) => {
  const { params } = useLocation();
  const { slug } = params;
  const { history } = useNavigation();
  const { SingleColumnSection, Loading, RevisionSelect } = Components;
  
  const { tag, loading: loadingTag } = useTagBySlug(slug, "TagBasicInfo");
  const { results: revisions, loading: loadingRevisions, loadMoreProps } = useMulti({
    skip: !tag,
    terms: {
      view: "revisionsOnDocument",
      documentId: tag?._id,
      fieldName: "description",
    },
    fetchPolicy: "cache-then-network" as any,
    collectionName: "Revisions",
    fragmentName: "RevisionMetadataWithChangeMetrics",
    ssr: true,
  });
  
  const compareRevs = useCallback(({before,after}: {before: RevisionMetadata, after:RevisionMetadata}) => {
    if (!tag) return;
    history.push(`/compare/tag/${tag.slug}?before=${before.version}&after=${after.version}`);
  }, [history, tag]);
  
  return <SingleColumnSection>
    <h1>{tag?.name}</h1>
    
    {(loadingTag || loadingRevisions) && <Loading/>}
    {revisions && tag && <RevisionSelect
      documentId={tag._id}
      revisions={revisions}
      getRevisionUrl={(rev: RevisionMetadata) => `/tag/${tag?.slug}?revision=${rev.version}`}
      onPairSelected={compareRevs}
      loadMoreProps={loadMoreProps}
  />}
  </SingleColumnSection>
}

const TagPageRevisionSelectComponent = registerComponent("TagPageRevisionSelect", TagPageRevisionSelect, {styles});

declare global {
  interface ComponentTypes {
    TagPageRevisionSelect: typeof TagPageRevisionSelectComponent
  }
}
