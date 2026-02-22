"use client";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import { tagGetUrl } from '../../lib/collections/tags/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import { useLocation } from '../../lib/routeUtil';
import LoadingOrErrorPage from "../common/LoadingOrErrorPage";
import SingleColumnSection from "../common/SingleColumnSection";
import { defineStyles, useStyles } from '../hooks/useStyles';
import CompareRevisions from "../revisions/CompareRevisions";
import RevisionComparisonNotice from "../revisions/RevisionComparisonNotice";
import { useTagBySlug } from './useTag';

const RevisionHistoryEntryMultiQuery = gql(`
  query multiRevisionTagCompareRevisionsQuery($selector: RevisionSelector, $limit: Int, $enableTotal: Boolean) {
    revisions(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...RevisionHistoryEntry
      }
      totalCount
    }
  }
`);

const styles = defineStyles('TagCompareRevisions', (theme) => ({
  title: {
    ...theme.typography["display3"],
    ...theme.typography["commentStyle"],
    marginTop: 0,
    fontWeight: 600,
    ...theme.typography.smallCaps,
  },
  description: {},
}));

const TagCompareRevisions = ({slug}: {slug: string}) => {
  const classes = useStyles(styles);
  const { query } = useLocation();
  const versionBefore = query.before;
  const versionAfter = query.after;
  const { tag, loading: loadingTag, error: tagError } = useTagBySlug(slug, "TagFragment");
  
  // Load the after- revision
  const { data, error: revisionError, loading: loadingRevision } = useQuery(RevisionHistoryEntryMultiQuery, {
    variables: {
      selector: { revisionByVersionNumber: { documentId: tag?._id, version: versionAfter } },
      limit: 10,
      enableTotal: false,
    },
    skip: !tag || !versionAfter,
    notifyOnNetworkStatusChange: true,
  });

  const revisionResults = data?.revisions?.results;
  
  if (!tag) {
    return <LoadingOrErrorPage loading={loadingTag} error={tagError} />
  }
  if (!revisionResults) {
    return <LoadingOrErrorPage loading={loadingRevision} error={revisionError} />
  }

  const revision = revisionResults[0];
  
  return <SingleColumnSection>
    <Link to={tagGetUrl(tag)}>
      <div className={classes.title}>
        {tag.name}
      </div>
    </Link>
    
    <RevisionComparisonNotice before={versionBefore} after={versionAfter}/>
    <div>
      <CompareRevisions
        collectionName="Tags" fieldName="description"
        documentId={tag._id}
        versionBefore={versionBefore}
        versionAfter={versionAfter}
        revisionAfter={revision}
      />
    </div>
  </SingleColumnSection>
}

export default TagCompareRevisions;



