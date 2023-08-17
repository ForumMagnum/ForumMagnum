import React, { useCallback } from 'react'
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useLocation, useNavigation } from '../../lib/routeUtil';
import { useTagBySlug } from '../tagging/useTag';
import { useMulti } from '../../lib/crud/withMulti';
import { tagGetRevisionLink, tagGetUrl, tagUrlBase } from '../../lib/collections/tags/helpers';
import { Link } from '../../lib/reactRouterWrapper';

const styles = (theme: ThemeType): JssStyles => ({
});

const TagPageRevisionSelect = ({ classes }: {
  classes: ClassesType
}) => {
  const { params, query } = useLocation();
  const { slug } = params;
  const focusedUser = query.user;
  const { history } = useNavigation();

  const { SingleColumnSection, Loading, RevisionSelect, TagRevisionItem, LoadMore } = Components;
  
  const { tag, loading: loadingTag } = useTagBySlug(slug, "TagBasicInfo");
  const { results: revisions, loadMoreProps, count, totalCount } = useMulti({
    skip: !tag,
    terms: {
      view: "revisionsOnDocument",
      documentId: tag?._id,
      fieldName: "description",
    },
    fetchPolicy: "cache-then-network" as any,
    collectionName: "Revisions",
    fragmentName: "RevisionMetadataWithChangeMetrics",
    enableTotal: true,
    itemsPerPage: 30,
  });
  
  const compareRevs = useCallback(({before,after}: {before: RevisionMetadata, after:RevisionMetadata}) => {
    if (!tag) return;
    history.push(`/compare/${tagUrlBase}/${tag.slug}?before=${before.version}&after=${after.version}`);
  }, [history, tag]);

  if (!tag) return null

  const getRevisionUrl = (rev: RevisionMetadata) => tagGetRevisionLink(tag, rev.version)
  return <SingleColumnSection>
    <h1><Link to={tagGetUrl(tag)}>{tag.name}</Link></h1>
    
    {loadingTag && <Loading/>}
    {revisions && <div>
      <RevisionSelect
        revisions={revisions}
        getRevisionUrl={getRevisionUrl}
        onPairSelected={compareRevs}
        loadMoreProps={loadMoreProps}
        count={count}
        totalCount={totalCount}
      />
      {revisions.map((rev, i) => {
        return <TagRevisionItem
          key={rev.version}
          tag={tag}
          collapsed={!!focusedUser && rev.user?.slug!==focusedUser}
          headingStyle="abridged"
          documentId={tag._id}
          revision={rev}
          previousRevision={revisions[i+1]}
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
