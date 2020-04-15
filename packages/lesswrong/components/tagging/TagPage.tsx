import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useLocation } from '../../lib/routeUtil';
import { useTagBySlug } from './useTag';
import Users from '../../lib/collections/users/collection';
import { Link } from '../../lib/reactRouterWrapper';
import { useCurrentUser } from '../common/withUser';
import { commentBodyStyles } from '../../themes/stylePiping'
import {AnalyticsContext} from "../../lib/analyticsEvents";
import Typography from '@material-ui/core/Typography';
import { truncate } from '../../lib/editor/ellipsize';

const styles = theme => ({
  tagPage: {
    ...commentBodyStyles(theme),
    color: theme.palette.grey[600]
  },
  description: {
    marginTop: 18,
    ...commentBodyStyles(theme),
    marginBottom: 18,
  },
  loadMore: {
    flexGrow: 1,
    textAlign: "left"
  },
  title: {
    marginTop: 0,
    ...theme.typography.commentStyle,
    fontWeight: 600,
    fontVariant: "small-caps"
  },
  wikiSection: {
    marginRight: 32,
    marginBottom: 32,
  },
  tagHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
  },
  postsTaggedTitle: {
    color: theme.palette.grey[600]
  },
  disabledButton: {
    '&&': {
      color: theme.palette.grey[500],
      cursor: "default",
      marginBottom: 12
    }
  }
});

const TagPage = ({classes}: {
  classes: ClassesType
}) => {
  const { SingleColumnSection, LWTooltip, PostsListSortDropdown, PostsList2, SectionButton, ContentItemBody, Loading, Error404 } = Components;
  const currentUser = useCurrentUser();
  const { query, params: { slug } } = useLocation();
  const { tag, loading: loadingTag } = useTagBySlug(slug);
  const [truncated, setTruncated] = useState(true)
  if (loadingTag)
    return <Loading/>
  if (!tag)
    return <Error404/>
    
  const terms = {
    ...query,
    filterSettings: {tags:[{tagId: tag._id, tagName: tag.name, filterMode: "Required"}]},
    view: "tagRelevance",
    limit: 15,
    tagId: tag._id,
  }

  const description = truncated ? truncate(tag.description?.html, 1400, "characters", "... <a>(Continue Reading)</a>") : tag.description?.html
  
  return <AnalyticsContext pageContext='tagPage' tagContext={tag.name}>
    <SingleColumnSection>
      <div className={classes.wikiSection}>
        <Typography variant="display3" className={classes.title}>
          {tag.name}
        </Typography>
        {Users.isAdmin(currentUser) ? <SectionButton>
            <Link to={`/tag/${tag.slug}/edit`}>Edit Wiki</Link>
          </SectionButton>
          :
            <LWTooltip title="Editing is not yet available [beta]">
              <SectionButton className={classes.disabledButton}>Edit Wiki</SectionButton>
            </LWTooltip>
        }
        <div onClick={()=>setTruncated(false)}>
          <ContentItemBody
            dangerouslySetInnerHTML={{__html: description}}
            description={`tag ${tag.name}`}
            className={classes.description}
          />
        </div>
      </div>
      <div className={classes.tagSection}>
        <div className={classes.tagHeader}>
          <div className={classes.postsTaggedTitle}>Posts tagged <em>{tag.name}</em></div>
          <PostsListSortDropdown value={query.sortedBy || "relevance"}/>
        </div>
        <PostsList2 
          terms={terms} 
          enableTotal 
          tagId={tag._id}
          itemsPerPage={200}
        />
      </div>
    </SingleColumnSection>
  </AnalyticsContext>
}

const TagPageComponent = registerComponent("TagPage", TagPage, {styles});

declare global {
  interface ComponentTypes {
    TagPage: typeof TagPageComponent
  }
}
