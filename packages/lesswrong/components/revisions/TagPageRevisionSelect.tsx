import React, { useCallback } from 'react'
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useTagBySlug } from '../tagging/useTag';
import { tagGetRevisionLink, tagGetUrl } from '../../lib/collections/tags/helpers';
import { tagUrlBaseSetting } from '../../lib/instanceSettings';
import { Link } from "../../lib/reactRouterWrapper";
import { useLocation, useNavigate } from "../../lib/routeUtil";
import SingleColumnSection from "../common/SingleColumnSection";
import Loading from "../vulcan-core/Loading";
import RevisionSelect from "./RevisionSelect";
import TagRevisionItem from "../tagging/TagRevisionItem";
import LoadMore from "../common/LoadMore";
import { useQuery } from "@apollo/client";
import { useLoadMore } from "@/components/hooks/useLoadMore";
import { gql } from "@/lib/generated/gql-codegen/gql";

const RevisionHistoryEntryMultiQuery = gql(`
  query multiRevisionTagPageRevisionSelectQuery($selector: RevisionSelector, $limit: Int, $enableTotal: Boolean) {
    revisions(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...RevisionHistoryEntry
      }
      totalCount
    }
  }
`);

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
  const { data, loading, fetchMore } = useQuery(RevisionHistoryEntryMultiQuery, {
    variables: {
      selector: { revisionsOnDocument: { documentId: tag?._id, fieldName: "description" } },
      limit: 10,
      enableTotal: true,
    },
    skip: !tag,
    fetchPolicy: "cache-then-network" as any,
    notifyOnNetworkStatusChange: true,
  });

  const revisions = data?.revisions?.results;

  const loadMoreProps = useLoadMore({
    data: data?.revisions,
    loading,
    fetchMore,
    initialLimit: 10,
    itemsPerPage: 30,
    enableTotal: true,
    resetTrigger: {
        view: "revisionsOnDocument",
        documentId: tag?._id,
        fieldName: "description",
      }
  });
  const totalCount = data?.revisions?.totalCount ?? 0;
  const count = revisions?.length ?? 0;
  
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


