import React, { useCallback } from 'react'
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useTagBySlug } from '../tagging/useTag';
import { useMulti } from '../../lib/crud/withMulti';
import { tagGetRevisionLink, tagGetUrl } from '../../lib/collections/tags/helpers';
import { tagUrlBaseSetting } from '../../lib/instanceSettings';
import { Link } from "../../lib/reactRouterWrapper";
import { useLocation, useNavigate } from "../../lib/routeUtil";
import SingleColumnSection from "../common/SingleColumnSection";
import Loading from "../vulcan-core/Loading";
import RevisionSelect from "./RevisionSelect";
import TagRevisionItem from "../tagging/TagRevisionItem";
import LoadMore from "../common/LoadMore";

const styles = (theme: ThemeType) => ({
});

const TagPageRevisionSelect = ({ classes }: {
  classes: ClassesType<typeof styles>
}) => {
  const { params, query } = useLocation();
  const { slug } = params;
  const focusedUser = query.user;
  const navigate = useNavigate();
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
    fragmentName: "RevisionHistoryEntry",
    enableTotal: true,
    itemsPerPage: 30,
  });
  
  const compareRevs = useCallback(({before,after}: {before: RevisionMetadata, after: RevisionMetadata}) => {
    if (!tag) return;
    navigate(`/compare/${tagUrlBaseSetting.get()}/${tag.slug}?before=${before.version}&after=${after.version}`);
  }, [navigate, tag]);

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

export default registerComponent("TagPageRevisionSelect", TagPageRevisionSelect, {styles});


