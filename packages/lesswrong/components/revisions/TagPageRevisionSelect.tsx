import React, { useCallback } from 'react'
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useLocation, useNavigation } from '../../lib/routeUtil';
import { useTagBySlug } from '../tagging/useTag';
import { useMulti } from '../../lib/crud/withMulti';
import { Tags } from '../../lib/collections/tags/collection';
import { Link } from '../../lib/reactRouterWrapper';

const styles = (theme: ThemeType): JssStyles => ({
});

const TagPageRevisionSelect = ({ classes }: {
  classes: ClassesType
}) => {
  const { params } = useLocation();
  const { slug } = params;
  const { history } = useNavigation();

  const { SingleColumnSection, Loading, RevisionSelect, TagRevisionItem, LoadMore } = Components;
  
  const { tag, loading: loadingTag } = useTagBySlug(slug, "TagBasicInfo");
  const { results: revisions, loading: loadingRevisions, loadMoreProps, count, totalCount } = useMulti({
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
    enableTotal: true
  });
  
  const compareRevs = useCallback(({before,after}: {before: RevisionMetadata, after:RevisionMetadata}) => {
    if (!tag) return;
    history.push(`/compare/tag/${tag.slug}?before=${before.version}&after=${after.version}`);
  }, [history, tag]);

  if (!tag) return null

  const getRevisionUrl = (rev: RevisionMetadata) => `${Tags.getUrl(tag)}?revision=${rev.version}`
  return <SingleColumnSection>
    <h1><Link to={Tags.getUrl(tag)}>{tag.name}</Link></h1>
    
    {(loadingTag || loadingRevisions) && <Loading/>}
    {revisions && <div>
      <RevisionSelect
        revisions={revisions}
        getRevisionUrl={getRevisionUrl}
        onPairSelected={compareRevs}
        loadMoreProps={loadMoreProps}
        count={count}
        totalCount={totalCount}
      />
      {revisions.map((rev, i)=> {
        return <TagRevisionItem 
          key={rev.version} 
          documentId={tag._id} 
          revision={rev} 
          previousRevision={revisions[i+1]}
          getRevisionUrl={getRevisionUrl}
        />
      })}
      <LoadMore {...loadMoreProps}/>
    </div>}
  </SingleColumnSection>
}

const TagPageRevisionSelectComponent = registerComponent("TagPageRevisionSelect", TagPageRevisionSelect, {styles});

declare global {
  interface ComponentTypes {
    TagPageRevisionSelect: typeof TagPageRevisionSelectComponent
  }
}
