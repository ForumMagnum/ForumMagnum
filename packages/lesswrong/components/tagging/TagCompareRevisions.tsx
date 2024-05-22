import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useTagBySlug } from './useTag';
import { useLocation } from '../../lib/routeUtil';
import { classes } from './TagPage';
import { tagGetUrl } from '../../lib/collections/tags/helpers';
import { Link } from '../../lib/reactRouterWrapper';

const TagCompareRevisions = () => {
  const { params, query } = useLocation();
  const { slug } = params;
  const versionBefore = query.before;
  const versionAfter = query.after;
  
  const { SingleColumnSection, CompareRevisions, RevisionComparisonNotice, Loading } = Components;
  
  const { tag, loading } = useTagBySlug(slug, "TagFragment");
  
  if (loading || !tag) return <Loading/>
  
  return <SingleColumnSection>
    <Link to={tagGetUrl(tag)}>
      <div className={classes.title}>
        {tag.name}
      </div>
    </Link>
    
    <RevisionComparisonNotice before={versionBefore} after={versionAfter}/>
    <div className={classes.description}>
      <CompareRevisions
        collectionName="Tags" fieldName="description"
        documentId={tag._id}
        versionBefore={versionBefore}
        versionAfter={versionAfter}
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
