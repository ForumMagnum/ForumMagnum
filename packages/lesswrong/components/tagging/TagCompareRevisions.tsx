import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useTagBySlug } from './useTag';
import { useLocation } from '../../lib/routeUtil';
import { tagGetUrl } from '../../lib/collections/tags/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { isFriendlyUI } from '@/themes/forumTheme';
import { useMulti } from '@/lib/crud/withMulti';
import { SingleColumnSection } from "../common/SingleColumnSection";
import { CompareRevisions } from "../revisions/CompareRevisions";
import { RevisionComparisonNotice } from "../revisions/RevisionComparisonNotice";
import { LoadingOrErrorPage } from "../common/LoadingOrErrorPage";

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

const TagCompareRevisionsInner = () => {
  const classes = useStyles(styles);
  const { params, query } = useLocation();
  const { slug } = params;
  const versionBefore = query.before;
  const versionAfter = query.after;
  const { tag, loading: loadingTag, error: tagError } = useTagBySlug(slug, "TagFragment");
  
  // Load the after- revision
  const { results: revisionResults, loading: loadingRevision, error: revisionError } = useMulti({
    collectionName: "Revisions",
    fragmentName: "RevisionHistoryEntry",
    terms: {
      view: "revisionByVersionNumber",
      documentId: tag?._id,
      version: versionAfter,
    },
    skip: !tag || !versionAfter,
  });
  
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

export const TagCompareRevisions = registerComponent("TagCompareRevisions", TagCompareRevisionsInner);


declare global {
  interface ComponentTypes {
    TagCompareRevisions: typeof TagCompareRevisions
  }
}
