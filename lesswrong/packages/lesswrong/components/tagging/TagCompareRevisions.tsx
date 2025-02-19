import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useTagBySlug } from './useTag';
import { useLocation } from '../../lib/routeUtil';
import { tagGetUrl } from '../../lib/collections/tags/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { isFriendlyUI } from '@/themes/forumTheme';
import { useMulti } from '@/lib/crud/withMulti';

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
  
  const { SingleColumnSection, CompareRevisions, RevisionComparisonNotice, LoadingOrErrorPage } = Components;
  
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

const TagCompareRevisionsComponent = registerComponent("TagCompareRevisions", TagCompareRevisions);


declare global {
  interface ComponentTypes {
    TagCompareRevisions: typeof TagCompareRevisionsComponent
  }
}
