import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useTagBySlug } from './useTag';
import { useLocation } from '../../lib/routeUtil';
import { tagGetUrl } from '../../lib/collections/tags/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { isFriendlyUI } from '@/themes/forumTheme';
import SingleColumnSection from "../common/SingleColumnSection";
import CompareRevisions from "../revisions/CompareRevisions";
import RevisionComparisonNotice from "../revisions/RevisionComparisonNotice";
import LoadingOrErrorPage from "../common/LoadingOrErrorPage";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";

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
    ...theme.typography[isFriendlyUI ? "display2" : "display3"],
    ...theme.typography[isFriendlyUI ? "headerStyle" : "commentStyle"],
    marginTop: 0,
    fontWeight: isFriendlyUI ? 700 : 600,
    ...theme.typography.smallCaps,
  },
  description: {},
}));

const TagCompareRevisions = () => {
  const classes = useStyles(styles);
  const { params, query } = useLocation();
  const { slug } = params;
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

export default registerComponent("TagCompareRevisions", TagCompareRevisions);



