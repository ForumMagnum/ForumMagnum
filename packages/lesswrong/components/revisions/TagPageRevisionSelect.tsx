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
  const { SingleColumnSection, Loading, RevisionSelect, TagRevisionItem } = Components;
  
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

  const getRevisionUrl = (rev: RevisionMetadata) => {
    if (tag) return `${Tags.getUrl(tag)}?revision=${rev.version}`
  }
  
  const compareRevs = useCallback(({before,after}: {before: RevisionMetadata, after:RevisionMetadata}) => {
    if (!tag) return;
    history.push(`/compare/tag/${tag.slug}?before=${before.version}&after=${after.version}`);
  }, [history, tag]);

  if (!tag) return null
  
  return <SingleColumnSection>
    <h1><Link to={Tags.getUrl(tag)}>{tag.name}</Link></h1>
    
    {(loadingTag || loadingRevisions) && <Loading/>}
    {revisions && <div>
      <RevisionSelect
        revisions={revisions}
        getRevisionUrl={getRevisionUrl}
        onPairSelected={compareRevs}
        loadMoreProps={loadMoreProps}
      />
      {revisions.map((rev, i)=> {
        if (i < (revisions.length-1)) {
          return <TagRevisionItem 
            key={rev.version} 
            documentId={tag._id} 
            revision={rev} 
            previousRevision={revisions[i+1]}
            getRevisionUrl={getRevisionUrl}
          />
        } 
      })}
    </div>}
  </SingleColumnSection>
}

const TagPageRevisionSelectComponent = registerComponent("TagPageRevisionSelect", TagPageRevisionSelect, {styles});

declare global {
  interface ComponentTypes {
    TagPageRevisionSelect: typeof TagPageRevisionSelectComponent
  }
}
