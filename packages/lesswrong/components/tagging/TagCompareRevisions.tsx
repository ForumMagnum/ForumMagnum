import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useTagBySlug } from './useTag';
import { useLocation } from '../../lib/routeUtil';
import { tagGetUrl } from '../../lib/collections/tags/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { isFriendlyUI } from '@/themes/forumTheme';

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
    <div>
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
